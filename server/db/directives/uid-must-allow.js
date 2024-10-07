import { mapSchema, MapperKind, getDirective } from "@graphql-tools/utils";

import { gql } from "apollo-server-express";
import { defaultFieldResolver } from "graphql";
import { query } from "../connection.js";
import { GetUserInfo } from "../resolvers/journal.js";

/**
 * Injects context.userInfo based on parameters from the requst trying to guess the subject user. 
 */

export const UserInfoDirective = gql`
    directive @UserMustAllow on OBJECT | FIELD_DEFINITION
    directive @needsUserInfo on OBJECT | FIELD_DEFINITION
`;

export const UserInfoSchemaTransformer = (schema) =>
    mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName) => {
            const thisDirective = getDirective(
                schema,
                fieldConfig,
                "UserMustAllow"
            )?.[0];

            const thisDirectiveB = getDirective(
                schema,
                fieldConfig,
                "needsUserInfo"
            )?.[0];

            if (thisDirective || thisDirectiveB) {
                const { resolve = defaultFieldResolver } = fieldConfig;

                fieldConfig.resolve = async function (
                    source,
                    args,
                    context,
                    info
                ) {
                    if (
                        args.uid ||
                        args.uname ||
                        args.eid ||
                        context.session?.id
                    ) {
                        var userRow;

                        //
                        // find user via eid
                        //
                        if (args.eid) {
                            const urowByEid = await query(
                                `SELECT B.* FROM exercises AS A INNER JOIN users AS B ON B.id=A.uid WHERE A.id=?`,
                                [args.eid]
                            );
                            userRow = urowByEid[0];

                            if (!userRow) {
                                throw new Error(
                                    "The exercise you are trying to access can't be found (mabe it was deleted or merged??)..."
                                );
                            }
                        }

                        //
                        // "GetUserInfo" throws error if es privado y no somos ni admin ni owner o si estamos bloqueados.
                        //
                        let userInfo = await GetUserInfo(
                            context.session?.id,
                            userRow ||
                                args.uid ||
                                args.uname ||
                                context.session?.id,
                            args.uname != null
                        );
                        context.userInfo = userInfo;  
                    }

                    return resolve(source, args, context, info);
                };

                return fieldConfig;
            }
        },
    });
