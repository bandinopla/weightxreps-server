import bodyParser from 'body-parser';
import cors from "cors";
import compression from "compression";
import express from 'express';
import { ApolloError, ApolloServer } from 'apollo-server-express';

import responseCachePlugin from 'apollo-server-plugin-response-cache'; 
import graphqlUploadExpress from 'graphql-upload/public/graphqlUploadExpress.js';
import $config from "./config.js";
import { StartCronJobs } from "./cron-jobs.js";
import WXRSchema from "./db/schema/WXRSchema.js"; 
import { OAuthRouter } from "./auth/router.js";
import { sessionMiddleware } from './session.js';


 
const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = "*"; 
const PORT = process.env.PORT || 4000;



async function startApolloServer() { 

    // Same ApolloServer initialization as before
    const server = new ApolloServer({ /*typeDefs, resolvers*/

        schema: WXRSchema
        , persistedQueries: false
        , introspection: !isProduction

        , context: ({ req, res }) => {

            //session.id

            //@ts-ignore
            if (req.session) //logged as a weightxreps user...
            {
                return {
                    //@ts-ignore
                    session: req.session
                };
            }

            //@ts-ignore
            else if (req.oauthSession) //<--- defined in `sessionMiddleware`
            {
                //@ts-ignore
                if (req.oauthSession.error) {
                    //@ts-ignore
                    throw new ApolloError(req.oauthSession.error)
                }

                return {
                    //@ts-ignore
                    session: { id: req.oauthSession.id },
                    //@ts-ignore
                    oauthSession: req.oauthSession
                }
            }
        }

        , plugins: [
            //process.env.NODE_ENV === 'production'? ApolloServerPluginLandingPageDisabled() : ApolloServerPluginLandingPageLocalDefault({ footer: false }) ,
            //ApolloServerPluginLandingPageGraphQLPlayground(),
            //ApolloServerPluginLandingPageLocalDefault({ footer: false }),

            //
            // el sessionId es un identificador del usuario unico.
            //
            responseCachePlugin({
                sessionId: (requestContext) => {

                    return requestContext.request.http?.headers.get('authorization') || null
                }
            })
        ]

        , formatError: (err) => {

            /*
            if( err.message.indexOf("ECONNREFUSED")>0 )
            {
              return new Error("Failed to connect to the database...");
            }
            */
            return err;
        }

        // , dataSources: ()=>{
        //   return {
        //     cachedQueries: new CachedQueries()
        //   }
        // }

    });

    // Required logic for integrating with Express
    await server.start();

    const app = express();

    app.use(
        cors(),
        sessionMiddleware,
        compression(),
        graphqlUploadExpress({ maxFileSize: $config.maxFileUploadSizeInKilobytes * 1000, maxFiles: 10 }), //https://github.com/jaydenseric/graphql-upload#function-graphqluploadexpress
        bodyParser.json(),
        bodyParser.urlencoded({ extended: false }),
    );

    app.use(baseUrl + '/auth', OAuthRouter);


    server.applyMiddleware({
        app,
        path: baseUrl + '/graphql',
        bodyParserConfig: {
            limit: "2mb"
        }
    });


    app.get(baseUrl, (req, res) => { res.redirect("https://github.com/bandinopla/weightxreps-server"); })

    // Modified server startup


    await new Promise( resolve => app.listen(PORT, ()=>resolve(null)));


    console.log(`🚀 Server ready !at http://localhost:${PORT}${server.graphqlPath}`);
}


startApolloServer();

if( isProduction )
{
    StartCronJobs();
}

