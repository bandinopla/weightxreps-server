 
import { deleteCachedIfKeyMatches, getCached } from "../../utils/cache.js";
import { ename2type } from "../../utils/ename2type.js";
import { query, transaction } from "../connection.js";
import { rpePercentLeftJoin } from "./rpe.js";



export const ExercisesResolver = {
    Query: { 
        getExercises: async (_, args, context)=>{

            const uid       = args.uid;
            const results   = await query(`SELECT * FROM exercises WHERE uid=?`,[uid]); //AND days > 0

            return results.map( row=>({
                e: {
                    id: row.id,
                    name: row.nombre, 
                    type: ename2type(row.nombre)
                },
                days: row.days || 0,
                reps: row.reps || 0
            }));
            
        },

        getPRsOf: async (_, args, context) => {
            
            const eid       = args.eid;
            const uid       = context.userInfo.id; //context.session.id;
            const till      = args.till; 

            return await getPRsOf(uid, eid, till);
        }
    },
    
    Mutation: {
        execExercise: async (_, args, context)=>{
             
            var mustConfirm;

            const resultEID = await execExercise( args.id, args.name, context.session.id, (msg,id)=>{

                if( args.confirms !=id )
                { 
                    mustConfirm = { __typename:"ConfirmAction", message:msg, id };
                    return false;
                }

                return true; 
            });
 
            return mustConfirm || { __typename:"Exercise", ...resultEID };
        },

        execBulkExercises: async (_, args, context)=>{

            if( args.eids.length<2 && args.mode!="DELETE" )
            {
                throw new Error("Merge action require at least 2 exercises...");
            }
 

            const queryResult = await execBulkExercises( args.eids, context.session.id, args.mode );

            // //
            // // check merge
            // //
            // if( queryResult )
            // {

            //     const check = await query(`SELECT id FROM exercises WHERE id IN (?);
            //                 SELECT * FROM erows WHERE eid IN (?);
            //                 SELECT id FROM logs WHERE log REGEXP ? AND uid=?`,[ args.eids, args.eids, "EBLOCK:("+args.eids.slice(0,-1).join("|")+")\\b\\s*", context.session.id ]);

            //         const targetEID = Number(args.eids[args.eids.length-1]);

            //         console.log("----------");
            //         console.log( check );
            //         console.log("----------");
            //         console.log("MERGE CHECK RESULT:"+targetEID);
            //         console.log("From Exercises: ", check[0].length==1 && check[0][0].id==targetEID );
            //         console.log("From Erows: ", check[1].filter(r=>r.eid!=targetEID).length==0 );
            //         console.log("From logs: ", check[2].length==0 );
                    
            // }

            return queryResult;
        }  
    }
}



/**
 * 
 * @param {string|null} eid if NULL se asumse se quiere crear un nuevo exercise
 * @param {string} name 
 * @param {string} uid id del owner (user.id)
 * @param {(msg:string, id:string)=>boolean} confirmator 
 * 
 * @returns {{ id:number, name:string, type:string }|null}
 */
export const execExercise = async ( eid, name, uid, confirmator ) => {
  
    const queryResult        = await query(`SELECT * FROM exercises WHERE 
                                        ( id=? OR nombre=? ) AND uid=?`, [ eid, name, uid ]);  
                                        
    //
    // contemplar que el name puede venir con TAGS
    // hay que qutiarselos a la hora de hacer query...
    //
    if( eid ) 
    {
        const e     = queryResult.find(row=>row.id==eid);

        if( !e ) 
            throw new Error("Can't find the exercise you are refering to...");

        //#region  DELETE
        if( name=="" )
        {  
            //
            // ID de los logs que usaron este exercise...
            //
            const logs      = await query(`SELECT DISTINCT logid FROM erows WHERE eid=? AND uid=?`, [e.id, uid]);
            const logids    = logs.map( row=>row.logid );

            const tran      = await transaction();
             
            //--> delete from exercises
            const deleted = await tran.query(`DELETE FROM exercises WHERE id=? AND uid=?`,[ e.id, uid ]);
 
            //--> delete from erows
            const delErows = await tran.query(`DELETE FROM erows WHERE eid=? AND uid=?`,[ e.id, uid ]);

            //--> update logs...   (solo los que lo tengan en uso...)
            if( logids.length )
            {
                const delFromLogs = await tran.query(`UPDATE logs SET log=REGEXP_REPLACE( log,"EBLOCK:${e.id}\\\\b\\\\s*","" ) 
                                                        WHERE uid=? AND id IN (?)`,[ uid, logids ]); 
            } 

            await tran.commit();


            // //
            // // check....
            // //
            // const check = await query(`SELECT * FROM exercises WHERE id=${e.id};
            //                             SELECT * FROM erows WHERE eid=${e.id} LIMIT 1;
            //                             SELECT * FROM logs WHERE log REGEXP "EBLOCK:${e.id}" LIMIT 1`);
            //         console.log("CHECK", check)
                  

            return {
                id      : e.id,
                name    : ""
            } 

        }
        //#endregion

        else 
        { 
            const other = queryResult.find( row=>row.id!=eid ); 

            //#region MERGE
            if( other )
            { 
                const actionConfirmed = !confirmator || confirmator(`You want to rename [${e.nombre}] to [${other.nombre}] but that name is already taken. Do you want to merge all data from [${e.nombre}] into [${other.nombre}] instead?`, "Yes, merge them.");

                if( !actionConfirmed ) 
                return; 

                //
                // ID de los logs que usaron este exercise...
                //
                const logs2rename      = await query(`SELECT DISTINCT logid FROM erows WHERE eid=? AND uid=?`, [e.id, uid]);
                const logids2rename    = logs2rename.map( row=>row.logid );

                 
                const tran      = await transaction();
 
                //--->delete old from exercises.
                const delOld    = await tran.query(`DELETE FROM exercises WHERE id=?`,[e.id]);
                
                //--->reset IDS en erows
                const mergeErows = await tran.query(`UPDATE erows SET eid=? WHERE eid=? AND uid=?`, [other.id, e.id, uid]);
                

                //--->rename affected logs en logs
                if( logids2rename )
                {
                    const logsRename = await tran.query(`UPDATE logs SET log = REGEXP_REPLACE( log,'EBLOCK:?\\\\b','EBLOCK:?' ) 
                                                            WHERE uid=?
                                                                AND id IN (?)`,[ e.id, other.id, uid, logids2rename ]);
                }
                
 
                await tran.commit();

                await __recalculateExerciseStats(other.id);
 
                return {
                    id: other.id,
                    name: other.nombre,
                    type: ename2type( other.nombre )
                }
            }
            //#endregion

            //#region  RENAME
            else 
            {
                const renamed = await query(`UPDATE exercises SET nombre=? WHERE id=? AND uid=?`, [ name, e.id, uid]);

                return {
                    id: e.id,
                    name: name,
                    type: ename2type( name )
                }
            }
            //#endregion 
        } 
    }
    else 
    {
        //
        // ese nombre ya existe...
        // devolver el existente.
        //
        if( queryResult.length )
        {
            return {
                id  : queryResult[0].id,
                name: queryResult[0].nombre, 
                type: ename2type(queryResult[0].nombre)
            }
        }
        else 
        {
            if( name=="" )
            {
                throw new Error("Invalid exercise name!");
            }

            const added = await query(`INSERT INTO exercises SET ?`, { nombre:name , uid });

            return {
                id: added.insertId,
                name: name, 
                type: ename2type(name)
            }
        }
    } 
}



export const execBulkExercises = async (eids, uid, mode)=>{ 

    switch( mode )
    {
        case "MERGE":
            return await __execBulkMerge( eids, uid );
        
        case "DELETE":
            return await __execBulkDelete( eids, uid );
    }

}

const __execBulkMerge = async ( eids, uid ) => {

    const rows      = await query(`SELECT * FROM exercises WHERE uid=? AND id IN (?)`, [uid, eids]);
    const target    = rows.find(row=>row.id==eids[eids.length-1]); 
    const others    = rows  .filter( row=>row.id!=target.id )
                            .map(e=>e.id); 

    if( !target )
    {
        throw new Error("Target exercise for the bulk action was not found.");
    }

    if( others.length==0 )
    {
        throw new Error("No other exercise (besides target) found.");
    }

    //
    // ID de los logs que usaron este exercise...
    //
    const logs2rename       = await query( `SELECT DISTINCT logid FROM erows WHERE eid IN (?) AND uid=?`, [ others , uid] );
    const affectedLogids    = logs2rename.map( row=>row.logid );  
    const tran              = await transaction();

    // delete other exercises
    await tran.query(`DELETE FROM exercises WHERE id IN (?) AND uid=?`, [ others, uid ]); 

    // rename erows to target
    await tran.query(`UPDATE erows SET eid=? WHERE eid IN (?) AND uid=?`, [ target.id, others, uid]);
    console.log("UPDATING EROWS: change eid from ", target.id, " to ", others);

    // rename in journals
    if( affectedLogids?.length > 0 )
    {
        await tran.query(`UPDATE logs SET log = REGEXP_REPLACE( log, ? ,'EBLOCK:?' ) 
                                    WHERE uid=?
                                    AND id IN (?)`,[ "EBLOCK:("+ others.join("|") +")\\b" , target.id, uid, affectedLogids ]);
    } 

    await tran.commit(); // true o no resuelve y tira error.
    await __recalculateExerciseStats(target.id);

    return true;
}


const __execBulkDelete = async ( eids, uid ) => {

    const logs2rename       = await query( `SELECT DISTINCT logid FROM erows WHERE eid IN (?) AND uid=?`, [ eids , uid] );
    const affectedLogids    = logs2rename.map( row=>row.logid );  

    const tran              = await transaction();  

    // delete other exercises
    await tran.query(`DELETE FROM exercises WHERE id IN (?) AND uid=?`, [ eids, uid ]); 

    // rename erows to target
    await tran.query(`DELETE FROM erows WHERE eid IN (?) AND uid=?`, [ eids, uid]);

    // rename in journals
    if( affectedLogids?.length > 0 )
    {
        await tran.query(`UPDATE logs SET log = REGEXP_REPLACE( log, ? ,'' ) 
                                    WHERE uid=?
                                    AND id IN (?)`,[ "EBLOCK:("+ eids.join("|") +")\\b\\s*" , uid, affectedLogids ]);
    } 

    return await tran.commit(); // true o no resuelve y tira error.

}


/**
 * Recalcula el valor de "days" y "reps" de un exercise
 */
export const __recalculateExerciseStats = async (eid, transaction) => {

    const eids = [ Array.isArray(eid)? eid : [eid] ];
    const exec = transaction?.query || query;

    //
    // borrar la cache de PRs de esos exercises
    //
    eids.forEach( _eid =>deleteCachedIfKeyMatches(new RegExp("\.of:"+_eid+"$")) );



    console.log("__recalculateExerciseStats", eids)
    //
    // acá se hace LEFT JOIN porque puede pasar que no hayan erows, por lo que se tiene que poder volver todo a 0
    //
    return await exec(`UPDATE exercises AS A 
                                    LEFT JOIN (SELECT eid AS id, COUNT(DISTINCT logid) AS days, SUM(reps*sets) AS reps FROM erows WHERE eid IN ? GROUP BY eid) AS B On B.id=A.id 
                                SET A.reps = IFNULL(B.reps,0), A.days=IFNULL(B.days,0) WHERE A.id IN ?`,[eids,eids])

}


export const ORIGINAL_1RM_FACTOR   = 46;

/**
 * Solo devuelve valor si las reps estan entre 1 y 10. Para valores mayores devuelve CERO.
 * Si se va a la mierda el valor, el cap es "999"
 * NOTA: se asume que r no va ser < 1.
 * --- 
 */

/** 
 * @param {string} w  sql column que contiene el peso
 * @param {string} r  sql column con las reps
 * @param {string} custom1rm  sql column con el factor para la formula de 1RM
 * @param {string} rpePercent  sql column con el valor del RPE % (if any) de este set.
 * @returns 
 */
export const sql1RMFormula  = ( w, r, custom1rm=ORIGINAL_1RM_FACTOR, rpePercent=null )=>{ 

    let base = ` IF( ${r}>10 , 0, LEAST(9999, ${w} * ( ${custom1rm}/ ( (${custom1rm}+1) -${r}) ) ) ) `;
    return rpePercent? `IF( ${rpePercent}>0, ${w}/${rpePercent} , ${base} )` : base;
}

/**
 * Esto se le pasa al front para que sepa cómo calcular el 1RM...
 */
export const JS_1RM_FORMULA = `r>10? 0 : Math.min(9999, w * ( (factor || ${ORIGINAL_1RM_FACTOR}) / (((factor || ${ORIGINAL_1RM_FACTOR})+1)-r) ) ) `;


/**
 * un sql SELECT id, custom1RM que devuelve siempre un valor en "custom1RM".
 */
export const SQL_SELECTING_CUSTOM1RM_FROM_USERS = `SELECT id, IF(custom1RM=0, ${ORIGINAL_1RM_FACTOR}, custom1RM) AS custom1RM from users`;

/**
 * Caclula los PRs de un exercise (analiza toda la base)
 * y despues si viene "till" filtra la data..
 * 
 * @param {number} uid
 * @param {number} eid 
 * @param {string} till  YYYY-MM-DD
 * 
 * @returns {Promise<{ exercise:{id:number, name:string}, prs:[{w:number, r:number, lb:number,when:string,bw:number, est1rm:number}], isRM:(w:number, r:number, till:Date=null)=>boolean }>}
 */
export const getPRsOf = async ( uid, eid, till )=>{

    const id            = `prs.uid:${uid}.of:${eid}`;
    const queryParams   = [ eid, uid ]; 

    const exerciseResult = await query(`SELECT id, nombre FROM exercises WHERE id=? AND uid=?`, queryParams);

    if( !exerciseResult.length )
        throw new Error("You are trying to reach an unknown exercise... (probably deleted, merged with another or just plain wrong?)");



    const exercise  = {
        id      : eid,
        name    : exerciseResult[0].nombre,
        type    : ename2type( exerciseResult[0].nombre )
    }



    var result = await getCached(id).or( async ()=>{ 

        

        // if( till ) queryParams.push(till);
        // ${ till? "AND B.fecha_del_log<?":""} 
        // todos los erows ordenados por fecha del log, block, id
        const queryResult = await query(` SELECT 
                                                A.wkg, 
                                                A.inlbs,
                                                A.reps, 
                                                A.sets,
                                                A.rpe,
                                                B.fecha_del_log AS ymd,
                                                B.bw,

                                                #
                                                # estimated 1RM usando la formula del usuario
                                                #
                                                ${sql1RMFormula("A.wkg","A.reps","C.custom1RM","RPE.rpePercent")} AS est1rm

                                            FROM
                                                erows AS A 
                                                
                                            INNER JOIN logs AS B ON B.id=A.logid 
                                            ${ rpePercentLeftJoin("RPE","A.reps", "A.rpe") }

                                            #
                                            # obtención del factor "custom1RM" para el calculo del estimated 1RM
                                            #
                                            INNER JOIN ( ${SQL_SELECTING_CUSTOM1RM_FROM_USERS} ) AS C ON C.id=A.uid

                                            WHERE A.eid=? AND A.uid=? 
                                            ORDER BY B.fecha_del_log ASC, A.id ASC `, queryParams );
    
        

        if( !queryResult.length ) // No hay datos...
            return null;
    
    
        const currentPR         = new Map(); // rep->(erow)
        const effPRs            = []; // EFF es el mejor est1rm row... 

        const prs               = [];
        var totalWorkouts       = 0;
        var lastDay             = 0;

        //
        // acá queremos saber cuantas reps hizo por cada rep range.
        //
        const repsPerRM         = new Map();
    
        //
        // por cada erow... calcular best "EFF" y mejor "RMs"
        //
        queryResult.forEach( erow => {
    
            const reps  = erow.reps; 

            if( lastDay != erow.ymd.valueOf() )
            {
                totalWorkouts++;
                lastDay = erow.ymd.valueOf();
            }
    
            if( reps<=0 ) return;

            //#region reps per RM 
                repsPerRM.set(reps, (repsPerRM.get(reps)||0) + erow.sets ); 
            //#endregion
    
            //
            // obtener PR actual para este RM
            //
            const current = currentPR.get(reps);


            //
            // == best EFF
            // save erow as best EFF si es el first run o si el actual "pr" es inferior
            //
            if( !effPRs.length || effPRs.slice(-1)[0].est1rm<erow.est1rm )
            {
                //
                // si son del mismo dia, borrar el viejo. Solo dejar 1 por día.
                //
                if( effPRs.slice(-1)[0]?.when.valueOf()==erow.ymd.valueOf() )
                {
                    effPRs.pop();
                }

                //
                // este es el "EFF" PR
                //
                effPRs.push({
                    w: erow.wkg,
                    r: erow.reps,
                    lb: erow.inlbs,
                    when: erow.ymd, //dateASYMD(erow.ymd, true),
                    bw: erow.bw,
                    est1rm: erow.est1rm
                });
            }

    
            //
            // == best RM PRs
            // first time doing RM o lo mejoramos en peso!
            //
            if( !current || current.wkg<erow.wkg )
            { 
                //
                // chequear que no tenga un PR mayor con reps superiores...
                //
                for (let [ rm, record ] of currentPR.entries())
                {
                    //
                    // si hay un "PR" en el mismo dia pero con menos peso y menos reps...
                    //
                    if( rm<reps && record.wkg<=erow.wkg && record.ymd.valueOf()==erow.ymd.valueOf() )
                    {
                        //
                        // quitarlo... 
                        //
                        prs.splice( prs.indexOf(record) ,1);
                    }
    
                    //
                    // hay algun PR con mas reps y el mismo peso o más...
                    //
                    else if( rm>reps && record.wkg>=erow.wkg )
                    {
                        return; // ignore, porque ha levantado mas pesado o igual por mas reps.
                    }
                } 
    
                //
                // ocurrieron el mismo dia? quitar el otro...
                //
                if( current?.ymd.valueOf()==erow.ymd.valueOf() )
                {
                    prs.splice( prs.indexOf(current) ,1);
                }
    
                //
                // current RM es...
                //
                currentPR.set( reps, erow );
    
                //
                // agregar PR 
                //
                prs.push({
                    w: erow.wkg,
                    r: reps,
                    lb: erow.inlbs,
                    when: erow.ymd, //dateASYMD(erow.ymd, true),
                    bw: erow.bw,
                    est1rm: erow.est1rm
                })
            }
    
        });


        //
        // reps stats
        //
        //#region Sets Of stats
        const repsStats = [];

        for (let [rep, total] of repsPerRM.entries()) {
            repsStats.push({
                r: rep,
                count: total
            });
        } 
        //#endregion
    
        return { 
                    prs, 
                    totalWorkouts,
                    setsOf: repsStats.sort( (a,b)=>a.r-b.r ),
                    effPRs
                };  
    
    }); //end getCached(id)


    if( !result )
    {
        result = {
            prs: [],
            totalWorkouts: 0,
            setsOf: [],
            effPRs: []
        }
    }


    //
    // solo hasta esta fecha
    //
    if( till )
    { 
        result = {
            ...result,
            prs         : result.prs.filter( pr=>pr.when.valueOf()<till.valueOf() ), 
            effPRs      : result.effPRs.filter( pr=>pr.when.valueOf()<till.valueOf() ), 
        }

        if( !result.prs.length )
        {
            return null;
        }
    }
 

    return  { ...result, 
                exercise,

                 
                /**
                 * En base a nuestro result, chequear si este WxR es un PR.
                 * 
                 * @param {number} w 
                 * @param {number} r 
                 * @param {Date} till 
                 * @returns {boolean}
                 */
                isRMPR: ( w, r, till )=> {

                    
                    //  200x2      200x3
                    // true si no levanto ese o mas peso por r o mas reps.
                    //
                    return !result.prs.some( pr=>pr.w>=w && pr.r>=r && (!till || pr.when.valueOf()<till.valueOf()) );
                },


                /**
                 * Devuelve los mejores eff int %
                 * un array de 2 items. Que pueden ser null.
                 * 
                 * @param {number} till un date.valueOf()
                 * @returns {[ {w:number, r:number, lb:number,when:string,bw:number, est1rm:number} | null ]}
                 */
                getBestEffInt: (till=null) => {

                    const out = [null,null]; //eff,int

                    //
                    // Best "INT"
                    // por cada PR, buscamos el mayor peso.
                    //
                    result.prs.some( pr=>{

                        //
                        // lo tomamos en cuenta si no hay limite de fecha o si estamos en el rango
                        //
                        if(!till || pr.when.valueOf()<till.valueOf())
                        {   
                            //
                            // es el mejor EFF??
                            //
                            // out[0] = out[0]?  pr.est1rm>out[0].est1rm? pr : out[0] 
                            //                 : pr.est1rm>0? pr : null;

                            //
                            // es el mejor INT??
                            //
                            out[1] = out[1]?  pr.w>out[1].w? pr : out[1] 
                                            : pr;
                        }
                        else 
                        {
                            // podemos salir, porque estan ordenados por fecha, el que le sigue solo puede ser misma fecha o mayor.
                            return true; //<---- breaks el "some" loop
                        }

                    } ); 

                    //
                    // Best "EFF"
                    //
                    result.effPRs.some( effPR => {

                        //
                        // lo tomamos en cuenta si no hay limite de fecha o si estamos en el rango
                        //
                        if(!till || effPR.when.valueOf()<till.valueOf())
                        {   
                            //
                            // es el mejor EFF??
                            //
                            out[0] = out[0]?  effPR.est1rm>out[0].est1rm? effPR : out[0] 
                                            : effPR.est1rm>0? effPR : null;
 
                        }
                        else 
                        {
                            // podemos salir, porque estan ordenados por fecha, el que le sigue solo puede ser misma fecha o mayor.
                            return true; //<---- breaks el "some" loop
                        }
                    });

                    return out;
                }
            };
}