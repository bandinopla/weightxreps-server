//import { ApolloServerPluginLandingPageLocalDefault } from "apollo-server-core";
import { ApolloServer } from 'apollo-server-express';
import responseCachePlugin from 'apollo-server-plugin-response-cache';

import compression from "compression";
import express from 'express';

import graphqlUploadExpress from 'graphql-upload/public/graphqlUploadExpress.js';
import $config from "./config.js";
import { StartCronJobs } from "./cron-jobs.js";
import { createSessionContext } from './db/resolvers/session.js';
import WXRSchema from "./db/schema/WXRSchema.js";
import bodyParser from 'body-parser'; 
import cors from "cors";
import {OAuthRouter, oauthServer} from "./auth/router.js";
import { isCrossOriginRequest } from './utils/is-cross-origin.js';

const isCodespace   = process.env.CODESPACES === 'true';
const isProduction  = process.env.NODE_ENV === 'production';
const baseUrl       = ( isProduction?"/wxr-server-2":"" );
const PORT          = process.env.PORT || 4000;

async function startApolloServer( ) {
  
 
  // Same ApolloServer initialization as before
  const server  = new ApolloServer({ /*typeDefs, resolvers*/
     
    schema: WXRSchema
    , persistedQueries: false
    , introspection: !isProduction
    
    , context: ({ req })=>{  
        return {
          ...createSessionContext( req )
        }  
      }
  
    , plugins:[ 
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

  const app         = express();

  app.use( 
      cors(),
      compression(), 
      //https://github.com/jaydenseric/graphql-upload#function-graphqluploadexpress
      graphqlUploadExpress({ maxFileSize: $config.maxFileUploadSizeInKilobytes * 1000, maxFiles: 10 }),//1000000
      bodyParser.json(),
      bodyParser.urlencoded({ extended: false }),
  );  

  app.use('/oauth', OAuthRouter);

  // //app.use(baseUrl + '/graphql', oauthServer.authenticate() ); // routes to access the protected stuff
  // // Middleware to conditionally apply OAuth authentication for cross-origin requests
  // app.use(baseUrl + '/graphql', (req, res, next) => { 

  //   // Check if the request is coming from a different origin
  //   if ( isCrossOriginRequest(req) ) { 
      
  //     // If it's cross-origin, apply OAuth authentication
  //     console.log("EXEC OAUTH!!!");
  //     oauthServer.authenticate()(req, res, next);
  //   } else { 
  //     // If it's same-origin, skip OAuth and proceed
  //     next();
  //   }
  // }); // Routes to access the protected stuff

  server.applyMiddleware({
     app, 
     path: baseUrl + '/graphql',
     bodyParserConfig: {
        limit: "2mb"
     }
  }); 


  app.get(baseUrl, (req, res) => { res.send(`<div style="
  font-family: 'Courier New', monospace;
  background-color: #000;
  color: #0f0;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
  display: inline-block;
  white-space: nowrap;
"> 
  <div style="margin-bottom: 10px;">
    C:\&gt; Weight For Reps Server!  (｡◕‿‿◕｡)
  </div>
  <div>
    Source code: <a href="https://github.com/bandinopla/weightxreps-server">Click here</a>
  </div>
  <div style="
    display: inline-block;
    width: 10px;
    height: 20px;
    background-color: #0f0;
    animation: blink 1s step-end infinite;
  "></div>
</div>

<style>
  @keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0; }
  }
</style>` ) })  
 
  // Modified server startup
  
 
    await new Promise( resolve => app.listen(PORT, ()=>resolve(null)));
 

  console.log(`🚀 Server ready !at http://localhost:${PORT}${server.graphqlPath}`);
} 


startApolloServer(); 

if( isProduction )
{
  StartCronJobs();
}

  