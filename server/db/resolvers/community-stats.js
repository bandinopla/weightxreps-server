import { getCached } from "../../utils/cache.js";
import { dateASYMD } from "../../utils/dateASYMD.js";
import { getAllOfficialEnames, getAllOfficialETags, getOfficialExercises } from "../../utils/ename2type.js";
import { query } from "../connection.js";
import { sql1RMFormula } from "./exercises.js";
import { UserFieldsManager } from "./inbox.js";
import $config from "../../config.js";
import { sbdstats } from "./sbd-stats.js";


console.log( sbdstats)


export const CommunityStatsResolver = {

    Query: {

        officialExercises: ()=>getOfficialExercises(),

        communityStats: async (_, args, context) => {
  
             
            const doAllYear = args.etype[0]=='$';

            const stats = await getCommunityStats( doAllYear? args.etype.substr(1) : args.etype, new Date(), doAllYear );
  
            // obtener info de usuarios y exercises.
            const uids = [];
            const eids = [];

            ["heavyest","estimated","volume"].forEach( prop => { 
                stats[prop]?.forEach( stat=> {
                    
                    uids.indexOf(stat.by)<0 && uids.push(stat.by);
                    eids.indexOf(stat.e)<0 && eids.push(stat.e); 
                });

            });

            if( !eids.length )
            {
                return {
                    ... stats,
                    timestamp: new Date()
                }
            }

            //
            // obtener la full data de cada entidad
            //
            const BY = new UserFieldsManager("users","");

            const info = await query(`SELECT ${BY.userFieldsQuery()} FROM users WHERE id IN (?);
                                        SELECT id, nombre FROM exercises WHERE id IN (?)`, [ uids, eids ]);

            
            return {
                ...stats
                , users: info[0].map( urow=>BY.extractUserData(urow) )
                , exercises: info[1].map( erow=>({ id:erow.id, name:erow.nombre, type:args.etype }) ) 
            } 
        },

        sbdStats: ()=>sbdstats
    }

};

/** 
 * @param {string} etype de este "official" exercise
 * @param {date} monthDate  en el mes de esa fecha...
 * @returns 
 */
const getCommunityStats = async ( etype, monthDate, doAllYear ) => {

    const ym = doAllYear? monthDate.getUTCFullYear() : dateASYMD(monthDate, false, "$1-$2");
    const id = "comunity-stats:"+etype+":"+ym;

    var basicResponse = {
        heavyest: [],
        estimated: [],
        volume: [],
        timestamp   : new Date(),
    };

    ////////////////////////////////////////
    const CACHE_FOR_MINUTES = $config.communityStatsCacheForMinutes;
    const result = await getCached(id, 1000*60*CACHE_FOR_MINUTES ).or( async ()=>{
    ////////////////////////////////////////  

        const date  = monthDate;

        //
        // RANGO DEL ANALISIS
        //
        var from    = new Date( Date.UTC( date.getUTCFullYear(), doAllYear? 0  : date.getUTCMonth(), 1 ) );  
        var to      = new Date( Date.UTC( date.getUTCFullYear(), doAllYear? 12 : date.getUTCMonth()+1, 0 ) ); 

        //
        // Obtener logs que estén dentro del rango de fecha a analizar...
        //
        const logs = await query(`SELECT logs.id, uid, IF(users.hidebw, 0 , logs.bw) AS bw, users.usekg, fecha_del_log AS ymd  
                                    FROM logs 
                                    INNER JOIN users ON users.id = logs.uid AND users.private=0 
                                    WHERE fecha_del_log BETWEEN ? AND ?`, [from, to]);

        if( !logs.length )
        {
            return; //no hay datos aún...
        }
 
         

        //
        // logid -> YMD  dicc...
        //
        const uids      = [];
        const logids    = [];
        const logid2ymd = new Map();
        const logid2bw  = new Map(); // id->{ v, lb }

        //#region UIDs array y LOGID2YMD  
        logs.forEach( log=>{
            
            logid2ymd   .set( log.id, dateASYMD(log.ymd,true));
            logid2bw    .set( log.id, { v:log.bw, lb:log.usekg?0:1 });
            
            if( uids.indexOf(log.uid)<0 )
            {
                uids.push( log.uid );
            } 

            logids.push( log.id ); 
        }); 
        //#endregion

        //
        // Obtener los eid de los ejercicios que vamos a estar analizando
        // 
        const eids          = [];
        const eid2exercise  = new Map();

        //#region get EIDs a buscar...
        const validEnames   = getAllOfficialEnames([ etype ]);
        const validEtags    = getAllOfficialETags([ etype ]);

        const exercises     = await query(`SELECT id, nombre FROM exercises 
                                                WHERE 
                                                uid IN (?)
                                                AND (nombre IN (?) OR nombre REGEXP ?)`, 
                                                [ uids, 
                                                    validEnames, 
                                                    "("+validEtags.join("|")+")\\b" ]);

            //
            // sin exercises, no hay nada que hacer...
            //
            if( !exercises.length )
                return ; 

                 

            exercises.forEach( row=>{

                eid2exercise.set( row.id, {
                    id  : row.id,
                    name: row.nombre,
                    type: etype
                });

                eids.push( row.id ); 
            });


        //#endregion
        

        //
        // ahora analizar los erows de estos logid y con estos eids
        //
        var heavyest  = [];
        var estimated = [];
        var volume    = [];

        //#region comenzar calculo de stats
        const stats = await query(`
            SELECT uid, logid, eid, wkg, inlbs, reps, (${ sql1RMFormula("wkg","reps") }) AS est1RM, ROUND(wkg*reps*sets) AS vol, sets
                FROM erows  
                WHERE uid IN (?)
                        AND eid IN (?)
                        AND logid IN (?)   
                        AND wkg BETWEEN 20 AND 500
                        AND reps > 0

        `, [ uids, eids, logids ]);

        if( !stats.length )
            return ; 

            const lastStatOf = new Map();

            //
            // analizando los erows y obteniendo los mejores...
            //
            stats.forEach( row => {

                const base = {
                    e: row.eid,
                    bw: logid2bw.get(row.logid),
                    by: row.uid
                }

                //#region HEAVYEST
                const _heavyest = {
                    ...base,
                    w: {
                        v: row.wkg,
                        lb: row.inlbs
                    }, 
                    reps: row.reps,
                    ymd: logid2ymd.get(row.logid)
                };

                __addIfBetter( lastStatOf, `h${_heavyest.by}-${_heavyest.e}`, _heavyest, heavyest ); 
                //#endregion

                //#region BEST ESTIMATED
                const _estimated = {
                    ...base,
                    w: {
                        v   : row.est1RM , //estimate
                        lb  : row.inlbs
                    }, 
                    originalw: {
                        v   : row.wkg,
                        lb  : row.inlbs
                    },
                    reps    : row.reps,
                    ymd     : logid2ymd.get(row.logid)
                };

                row.reps<11 && __addIfBetter( lastStatOf, `est${_estimated.by}-${_estimated.e}`, _estimated, estimated ); 
                //#endregion

                //#region VOLUME 
                let volID = `v${row.uid}-${row.eid}`;
                var vol = lastStatOf.get( volID );

                if( !vol )
                {
                    vol = {
                        ...base,
                        totalReps: row.reps * row.sets,
                        w: {
                            lb: logid2bw.get( row.logid ).lb,
                            v: row.vol 
                        }
                    }

                    lastStatOf.set( volID, vol );
                    volume.push( vol );
                }
                else 
                {
                    vol.w.v += Math.round(row.vol);
                    vol.totalReps += row.reps * row.sets;
                } 
                //#endregion
 
            });

        //#endregion

         
         
        return { 
            heavyest    : heavyest  .sort( _sortByW ) .reduce( _removeDuplicatedUsers, [] ), 
            estimated   : estimated .sort( _sortByW ) .reduce( _removeDuplicatedUsers, [] ) ,
            volume      : volume    .sort( _sortByW ) .reduce( _removeDuplicatedUsers, [] ) ,  
            timestamp   : new Date(),
        } 

    });


    if( result )
    {
        basicResponse = {
            ...basicResponse,
            ...result
        }
    }


    return {
        ...basicResponse, 
        scanFrecuency : CACHE_FOR_MINUTES+" minutes"
        , title:"Best of "+ 
        
        (doAllYear? monthDate.getUTCFullYear()
                : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][monthDate.getMonth()]
        )
    }
}

const _sortByW = (a,b)=> {

    if( b.w.v==a.w.v ) //si el peso es el mismo...
    {
        if( b.reps==a.reps )
        {
            //gana el que pesa menos....
            return a.bw?.v - b.bw?.v ;
        }

        return b.reps-a.reps; // gana el que hizo mas reps...
    }
    return b.w.v-a.w.v;
};

//
// siempre usa "obj.w.v" como comparition factor.
//
const __addIfBetter = ( dicc, id, obj, arr) => { 
                
    if( !(dicc.get(id)?.w.v>obj.w.v) )
    {

        // Si ambos usaron el mismo peso....
        if( dicc.get(id)?.w.v==obj.w.v )
        {
            // si hay info de reps... solo se considera mejor si hizo MAS reps.
            if( obj.reps>0 &&  dicc.get(id)?.reps>obj.reps )
            {
                return;
            }
        }

        let remove = dicc.get(id);

        dicc.set(id, obj);

        if( remove )
        {
            arr.splice( arr.indexOf(remove),1, obj);
        }
        else 
        {
            arr.push( obj );
        } 
    }
}


const _removeDuplicatedUsers = ( out, val, i, arr ) => {

    // val.w.v 
    // val.by
    // val.reps
    if( out.findIndex( itm=>itm.by==val.by )<0 )
    {
        out.push(val)
    }

    return out;


}