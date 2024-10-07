import gql from "graphql-tag";
import { mapSchema, MapperKind, getDirective } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLSchema } from 'graphql'

/**
 * This directive when used in the graphql schema will act as a firewall if the api is being accessed using oauth.
 */
export const OAuthDirective = gql`
    scalar OauthReplacementType 

    directive @oauth( scope: String!, action:OAuthAction=ERROR, replacement:OauthReplacementType ) on OBJECT | FIELD_DEFINITION
    directive @no_oauth on FIELD_DEFINITION


    enum OAuthAction {
        ERROR
        REPLACE
    }
`; 


// export const OAuthDirectiveSchemaTransformer = schema=>OAuthDirectiveSchema(NO_OAuthDirectiveSchema(schema))

const createDirectiveResolver = (directiveName, checkFunction) => schema =>
    mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
            const directive = getDirective(schema, fieldConfig, directiveName)?.[0];
            if (!directive) return;

            const { resolve = defaultFieldResolver } = fieldConfig;
            fieldConfig.resolve = async (source, args, context, info) =>
                checkFunction(directive, source, args, context, info, resolve);
            return fieldConfig;
        }
    });

const OAuthDirectiveSchema = createDirectiveResolver("oauth", (directive, source, args, context, info, resolve) => {
    const { scope, action, replacement } = directive;
    if (context.oauthSession?.hasScope(scope) === false) {
    //if (true) {
        if (action === "REPLACE") return replacement ?? "?";
        throw new Error(`Unauthorized, client lacks the required scope: ${scope}`);
    }
    return resolve(source, args, context, info);
});

const NO_OAuthDirectiveSchema = createDirectiveResolver("no_oauth", (_, source, args, context, info, resolve) => {
    if (context.oauthSession) throw new Error(`This resource is not accessible by OAuth clients`);
    return resolve(source, args, context, info);
});

export const OAuthDirectiveSchemaTransformer = schema => OAuthDirectiveSchema(NO_OAuthDirectiveSchema(schema));