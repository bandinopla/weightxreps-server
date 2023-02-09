import mysql from "mysql";
// https://www.npmjs.com/package/mysql#performing-queries
import config from "../config.js";
 

var __pool;
var $pool = {
    getConnection( callback ) {

        if( !__pool )
        { 
            __pool = mysql.createPool({
                connectionLimit   : 10,
                host              : config.host,
                user              : config.user,
                password          : config.pass,
                database          : config.dbname,
                port              : config.port,
                multipleStatements: true,
                timezone:"Z",
                supportBigNumbers: true,
                bigNumberStrings: true
            });
        }

          return __pool.getConnection(callback);
    }
}

/**
 * @see https://www.npmjs.com/package/mysql#error-handling
 * @param {*} err 
 */
  const $logError = err => {
        console.log( err );
  }
 
  

  export const query = (sql, parameters, rawError ) => {  

    return new Promise( (resolve, reject)=>{ 


        $pool.getConnection( (err, connection)=>{

            if( err ) {
                $logError( err );
                return reject( new Error("Failed to connect to database... " ) );
            }

            var q = connection.query({ sql, values:parameters }, function (error, results, fields) {

                connection.release();
    
                if (error) 
                {
                    if( rawError )
                    {
                        return reject(error);
                    }
                    
                    $logError( error );
                    console.log( { error } ); 
                    return reject( new Error("Error while talking to the database...") );
                }
                resolve( results ); 
            }); 

            //console.log( q.sql, q.query )

        } ); 

        //connection.end();
    })
}


/**
 * Devuelve un apromesa que resuelve al API a usar dentro de esta trasnaccion.
 * 
 * @returns {{ query:(sql:string, parameters:array)=>mysql.Query, commit:()=>void }}
 */
export const transaction = ()=> {
    return new Promise( (resolve, reject)=>{

        $pool.getConnection( (err, connection)=>{

            if( err ) {
                $logError( err );
                return reject( new Error("Failed to connect to database...") );
            }

            connection.beginTransaction( err2 => {

                if( err2 ) {
                    $logError( err2 );
                    return reject( new Error("Failed to begin transaction...") );
                }


                resolve({

                    query: (sql, parameters) => {

                        return new Promise( (resolveQuery, rejectQuery)=>{
 
                            var qry = connection.query( sql, parameters , function (error, results, fields)
                            {
                                if( error ) {
                                    $logError( error );

                                    return connection.rollback(function() 
                                    {
                                        console.log( error )
                                        rejectQuery( new Error("Failed to execute transaction's query..."));
                                    });
                                }

                                resolveQuery( results ); 
                            }); //query

                            

                        }); //Promise
                    },

                    abort: (errorMessage)=>{

                        return new Promise( ( done, reject)=>{

                            connection.rollback(function() 
                            { 
                                //console.log("TRANSACTION ABORTED");
                                errorMessage? reject( new Error(errorMessage) ) : done();
                            });

                        });
                    },

                    commit: () => {

                        return new Promise( (resolveCommit, rejectCommit)=> {

                            connection.commit( err=> {

                                if( err ) {
                                    return connection.rollback(function() 
                                    {
                                        rejectQuery(new Error("Failed to commit transaction..."));
                                    });
                                }

                                connection.release();
                                resolveCommit(true);

                            });//connection.commit

                        });//Promise

                    }//commit

                });//resolve


            });//beginTransaction

        } );//getConnection

    }); //Promise
}


 