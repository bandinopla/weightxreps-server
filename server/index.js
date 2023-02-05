import { ApolloServerPluginLandingPageLocalDefault } from "apollo-server-core";
import { ApolloServer } from 'apollo-server-express';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import compression from "compression";
import express from 'express';
import graphqlUploadExpress from 'graphql-upload/public/graphqlUploadExpress.js';
import $config from "./config.js";
import { StartCronJobs } from "./cron-jobs.js";
import { createSessionContext } from './db/resolvers/session.js';
import WXRSchema from "./db/schema/WXRSchema.js";
 

async function startApolloServer( ) {
  
 
  // Same ApolloServer initialization as before
  const server  = new ApolloServer({ /*typeDefs, resolvers*/
     
    schema: WXRSchema
    
    , context: ({ req })=>{  
        return {
          ...createSessionContext( req )
        }  
      }
  
    , plugins:[ 
          //process.env.NODE_ENV === 'production'? ApolloServerPluginLandingPageDisabled() : ApolloServerPluginLandingPageLocalDefault({ footer: false }) ,
          //ApolloServerPluginLandingPageGraphQLPlayground(),
          ApolloServerPluginLandingPageLocalDefault({ footer: false }),

          //
          // el sessionId es un identificador del usuario unico.
          //
          responseCachePlugin.default({
            sessionId: (requestContext) => {
               
              return requestContext.request.http.headers.get('authorization') || null
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

  const app         = express();

  app.use(
      compression(),

      //https://github.com/jaydenseric/graphql-upload#function-graphqluploadexpress
      graphqlUploadExpress({ maxFileSize: $config.maxFileUploadSizeInKilobytes * 1000, maxFiles: 10 }),//1000000
  ); 
  

  //const httpServer  = createServer(app);
  const baseUrl = (process.env.NODE_ENV=='production' && process.env.NODE_SSHTUNNEL!='yes'?"/wxr-server-2":"");

  server.applyMiddleware({
     app, 
     path: baseUrl + '/graphql'
  }); 


  app.get('/', (req, res) => { res.send('Hello World! '+app.get('env')) })  
 
  // Modified server startup
  const PORT = process.env.PORT || 4000;

  await new Promise( resolve => app.listen({ port: PORT }, resolve));

  console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
}



startApolloServer(); 
StartCronJobs();