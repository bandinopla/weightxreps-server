import { mapSchema, MapperKind, getDirective } from '@graphql-tools/utils';

import { gql } from 'apollo-server-express';
import { defaultFieldResolver } from 'graphql';


/**
 * permite usar la directive "@auth" en fields que requieran que el usuario este registrado o sea admin
 * @see enum Role
 */



export const AccessRestrictionDirective = gql`
    directive @auth( requires: Role = REGISTERED_USER) on OBJECT | FIELD_DEFINITION

    enum Role {
        ADMIN
        REGISTERED_USER
    }`;

export const uidIsAdmin = uid=>uid==1;


export const AccessRestrictionSchemaTransformer = schema => mapSchema(schema, {

    [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName) => {

        const thisDirective = getDirective(schema, fieldConfig, "auth")?.[0] ;

        if ( thisDirective ) 
        {
            const { requires } = thisDirective;

            if (requires) 
            {
              const { resolve = defaultFieldResolver } = fieldConfig;

              fieldConfig.resolve = async function (source, args, context, info) 
              { 
 
                if (!context.session) {
                    throw new Error('You are not authenticated!!!!!');
                }  

                if( requires=="ADMIN" && !uidIsAdmin(context.session.id)) {
                    throw new Error('You are not ADMIN, sorry...');
                }
 
                return resolve(source, args, context, info);
              }

              return fieldConfig;
            }
        }
    }

});

