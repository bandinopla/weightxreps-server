 
import { dateASYMD, ymd2date } from "../../utils/dateASYMD.js";
import { lb2kg } from "../../utils/lb2kg.js";
import { query, transaction } from "../connection.js";
import { __recalculateExerciseStats } from "./exercises.js"; 
import { addEditorUtags, createNewTagsIfAny, deleteUnusedUTags, deleteUTagsFromLog, getUTagId, getUTags, preventDuplicatedUTagsOnSave, utagTokenToText } from "./tags.js";

//https://stackoverflow.com/a/63464318/18693152 
const removeWeirdChars = str=>str.replace(/[^\p{L}\p{N}\p{P}\p{Z}{\^\$\n}]/gu, '');

export const SaveJournalResolver = {

    saveJEditor: async(parent, args, context) => {

        let myId            = context.session?.id;  
        const usekg         = context.userInfo.usekg;
        const userKnownBW   = context.userInfo.bw;
        const defaultYMD    = args.defaultDate; //<--- un YMD


        /**@type [{ id:number, ymd:string }] */
        var _modifiedLogs = [];

        //
        // nos vamos a estar fijando si esta guardando el dia de "hoy" y si es asi, 
        // ponemos el BW de ese log en el BW del row users de myId.
        //
        var todaysBW        = 0; 

        /**
         * types:
         *      { on:ymd }
         *      { bw:number }
         *      { tag:string, type:string, value:number }
         *      { text:string }
         *      { eid, erows:[ { w:{v,lb,usebw:1|-1 }, r, s, c, rpe } ] } 
         *                      w:puede ser un array
         *                      r:puede ser un array
         */

        const deleteYMD = []; //<--- days to delete.
        

        //
        //1) obtener enames (para saber si esta referenciando valid enames)
        //
        const exercises         = await query(`SELECT id, nombre FROM exercises WHERE uid=?`, [myId]);
        const [utags]           = await getUTags( myId );
        const knownEids         = exercises.map(r=>r.id); //<--- puede ser empty si es la primera vez que guarda algo...
        
        //
        // exercises que hay que crear holder...
        //
        const newExercises = []; 
 
        //#region agrupar rows en [ { on, did }, ... ]
        var lastDay     = null;
        const onDayDid  = args.rows 
                            //
                            // quitamos los tags para crear new exercises.
                            //
                            .filter(row=>{

                                if( row.newExercise )
                                {
                                    //
                                    // y lo agregamos en el array de new exercises...
                                    //
                                    newExercises.push({ name: row.newExercise.replace(/^\s*#?/,"").trim() });
                                    return false;
                                } 

                                return true;

                            })

                            //
                            // reconvertimos de array plano a uno agrupado por día. Estilo [ {on:ymd, did:[erows...] }, ... ]
                            //
                            .reduce( (out, row)=>{

                                if( row.on )
                                {
                                    lastDay = out.find(d=>d.on==row.on) ;
                                    
                                    if(!lastDay)
                                    {
                                        lastDay = { on:row.on, did:[] };
                                        out.push(lastDay); 
                                    }
                                }
                                else 
                                { 
                                    if( !lastDay )
                                    {
                                        lastDay = { on:defaultYMD, did:[] };
                                        out.push(lastDay); 
                                    }

                                    //
                                    // bodyweight TAG
                                    //
                                    if( row.bw )
                                    {
                                        //
                                        // si el unit es LBS o no tiene unit y el usuario usa LBS por default...
                                        //
                                        lastDay.bw = (row.lb==1 || (row.lb==null && !usekg)) ? lb2kg(row.bw) : row.bw;
                                    }

                                    //
                                    // DELETE tag
                                    //
                                    else if( row.delete )
                                    {
                                        //
                                        // flag este día para ser borrado.
                                        //
                                        deleteYMD.indexOf(lastDay.on)<0 && deleteYMD.push( lastDay.on );
                                    }

                                    else 
                                    {
                                        //
                                        // in the case of UTAGS prevent duplicates
                                        //
                                        if( !row.tag || preventDuplicatedUTagsOnSave( row, lastDay.did ) )
                                        {
                                            lastDay.did.push( row ); 
                                        }
                                        
                                    }
                                }

                                return out; 
                            },[]);
        //#endregion

        //
        // que comience la magia...
        //
        const tran      = await transaction();  


        const recalculateEStatsOf   = []; //<--- EIDs de los exercises para recalcular

        try
        {
            //
            // crear los nuevos exercises if any
            // [!] solo crear los que se hayan referenciado por algún día, y ese día no esté flagueado para ser eliminado. 
            //
            await __createNewExercises( tran, newExercises.filter( (e, eIndex)=>{

                //
                // buscar si este ejercicio se utilizó en algún día...
                //
                return onDayDid.some( day=>{
                           //
                           // si el día se marcó para borrar. Ignorar... 
                           //
                    return deleteYMD.indexOf( day.on)>-1? false 
                                                            //
                                                            // ver si el día tiene eblocks de este ejercicio...
                                                            //
                                                            : day.did.some( row=> row.eid<=0 && Math.abs(row.eid)==eIndex )
                });

            }), myId );


            //#region TAGS

                /**
                 * all tag tokens from this save operation...
                 */
                const tagTokens = onDayDid.flatMap(day=>day.did).filter(row=>row.tag);

                //
                // UTAGS. If any UTAG is new, it will be created.
                //
                await createNewTagsIfAny( tran.query, myId, tagTokens, utags ); 
 
            //#endregion


            //
            // acá voy a meter todos los erows a insertar en la tabla erows, con los campos nombrados con el nombre de la columna en mysql
            //
            const erowsToInsert         = [];  

            //
            // por cada día...
            //
            for (let i = 0; i < onDayDid.length; i++) 
            {
                const day                   = onDayDid[i];
                const ymd                   = day.on;
                const markedForDeletion     = deleteYMD.indexOf( ymd )>-1;
                var bw                      = day.bw; //<-- puede ser null o 0...
                var blockIndex              = 0;
                const dayErows              = []; //<-- aca ponemos los erows del día...
                const dayUTags              = [];

                //
                // si es la fecha de hoy... recordar este BW (que está en Kilos) como el ultimo BW...
                //
                if( ymd==dateASYMD(new Date(),true) )
                {
                    todaysBW = bw;
                }
                

                //
                // hay que definir si el log ya existe o es un nuevo log.
                //
                const log           = await query(`SELECT id FROM logs WHERE uid=? AND fecha_del_log=?`, [myId, ymd]); 
                var logid           = log[0]?.id; //<-- puede ser null... 
                const logOldErows   = logid>0? await query(`SELECT DISTINCT eid FROM erows WHERE logid=?`, [logid]) : null;


                //#region >>> Resolve LOG ID
                if( logid )
                { 
                        // delete old erows
                        await tran.query(`DELETE FROM erows WHERE logid=?`,[ logid ]); 

                        // delete old tags
                        await deleteUTagsFromLog( tran.query, logid ); 
 
                        // 
                        if( markedForDeletion )
                        {
                            //
                            // borrar log
                            //
                            await __deleteLog( tran, logid ); 
                            continue;
                        }
                }
                else if( !markedForDeletion )
                {
                        // insert new
                        const newLog = await tran.query(`INSERT INTO logs SET ?`, {
                            uid                 : myId,
                            ultima_modificacion : new Date(),
                            fecha_del_log       : ymd,
                            bw                  : bw || 0, 
                            fromMobile          : 0
                        });

                        logid = newLog.insertId;

                        if( !logid )
                        {
                            throw new Error("Weird... failed to create log "+ymd+" for some reason. Unexpected...")
                        } 
                }
                else 
                {
                    // ignore everything in this day
                    continue;
                }
                //#endregion

 
                //
                // old erows
                //
                if( logOldErows?.length > 0 )
                {
                    //
                    // recalcular porque si se borra y se esta logueando otra cosa, va a quedar con data vieja...
                    //
                    logOldErows.forEach( erow=>recalculateEStatsOf.push(erow.eid) );
                }


                //
                // SAVE USER TAG's VALUES
                // tag values for this day. Now every tag token will contain the ID of the token value in it.
                //  
                await addEditorUtags( tran.query, myId, day.did .filter( token=>token.tag ), logid ) ; 
 

                //
                // LOG TOKEN ---> TEXT
                //
                const logText   = !markedForDeletion && day.did.reduce( (out, what)=>{

                    //
                    // solo texto...
                    //
                    if( what.text )
                    {
                        out += what.text+"\n";
                    }

                    //
                    // un BLOCK:##
                    //
                    else if( what.eid!=null )
                    {
                         //console.log( what.eid, "<=0 --->", what.eid<=0 )
                        var eid = what.eid<=0?  newExercises[ Math.abs(what.eid) ].id  : what.eid ; 
 


                        //#region Valid EID??
                        if( what.eid>0 && knownEids.indexOf(eid)<0 )
                        {
                            let line = what.erows[0].line-1;
                            throw new Error(`JEDITOR:${line} Can't find the exercise... it is supposed to be one of yours, but couldn't find it. Mabe you deleted it in another browser tab? Try refreshing the page, you might be working with "old" data.`)
                        } 
                        //#endregion

                        out += "EBLOCK:"+eid+"\n";

                        //
                        // valores que todos los erows de este block van a tener...
                        //
                        const erowBase = {
                            uid     : myId,
                            eid,
                            block   : blockIndex
                        }

                        //#region forEach EROW / SET
                        for (let j = 0; j < what.erows.length; j++) 
                        {
                            const set = what.erows[j]; 

                            //caso W,W,W
                            if( Array.isArray(set.w) )
                            {
                                set.w.forEach( (www,i)=>{
                                    __pushInputSetToErowToInsert( dayErows, { ...set, i, w:www, c:i==set.w.length-1? set.c : "" }, bw, usekg, erowBase )
                                });
                            } 
                            //caseo R,R,R
                            else if( Array.isArray( set.r ))
                            {
                                set.r.forEach( (rrr,i)=>{
                                    __pushInputSetToErowToInsert( dayErows, { ...set, i, r:rrr, c:i==set.r.length-1? set.c : "" }, bw, usekg, erowBase)
                                });
                            }
                            //normal
                            else 
                            {
                                __pushInputSetToErowToInsert( dayErows, set, bw, usekg, erowBase);
                            }
                        }
                        //#endregion

                        blockIndex++;
                    }

                    //
                    // un UTAG
                    //
                    else if( what.tag )
                    {
                        //we wont add the TAG to the log because that will "break" the mobile app i a way showing weird texts...

                        out += utagTokenToText( what )+"\n";
                        dayUTags.push( what );
                    }

                    return out;

                } ,"").trim();  


                //
                //  Check if there's something relevant to save...
                //
                if( !logText.length && !bw )
                { 
                    //
                    // Actually, @azothriel mentioned that she sometimes wants to save an empty workout to log the bodyweight...
                    //
                    throw new Error("The text content for day "+ymd+" is empty... did you forgot to type something? To delete a day you must type \"delete\" in the log text so the system knows your intention to delete.");
                }

 
                //
                // SAVE LOG TEXT
                //
                await tran.query(`UPDATE logs SET log=?, bw=? WHERE id=?`, [ removeWeirdChars(logText), bw, logid ]);  //<-- logText can be an empty string...


                //
                // ir recordando que LOG ids se tocaron en este save... ( si se lo hubiera borrado no se llega aca porque se hace un "continue" )
                //
                _modifiedLogs.push({ id:logid, when:ymd2date(ymd) });


                //
                // si hay erows, agregarles la información faltante
                //
                if( dayErows.length )
                {
                    //
                    // seteamos el LOG ID de los erows de este día...
                    //
                    dayErows.forEach( erow=> erow.logid=logid );

                    //agregar al array de erows to insert....
                    Array.prototype.push.apply( erowsToInsert, dayErows );
                } 
            }


            

            //
            // insert erows...
            //
            if( erowsToInsert.length )
            {
                const erowsAdded = await tran.query(`INSERT INTO erows (${ Object.keys( erowsToInsert[0] ).join(",") }) VALUES ?`
                                    , [ erowsToInsert.map( erow=>Object.values(erow) ) ]); 

                if( !erowsAdded.affectedRows )
                {
                    throw new Error("Unexpected error while trying to save your sets... nothing was saved.");
                }

                //
                // recalcular estadísticas de los ejercicios referenciados en este bulk-save
                //
                erowsToInsert.forEach( erow=>recalculateEStatsOf.push( erow.eid ) );

                // var eids = erowsToInsert.map(row=>row.eid).reduce( (out, eid)=>{
                //     if( out.indexOf(eid)<0 ) out.push(eid);
                //     return out;
                // } ,[]); 
            }  
            
            //
            // all done!
            //
            await tran.commit();   
            
        }

        //
        // on error abort transaction...
        //
        catch( e )
        {  
            await tran.abort( "Aborted because of ----> "+String(e) );
        } 


        //
        // todo guardado! update users row...
        // 
        try 
        { 
            //
            // UTAGS not referenced by any log
            //
            await deleteUnusedUTags( myId );


            //#region >>> Recalculate Exercise Stats
            //
            // EIDs que fueron aftectados por este save, sea para agregarles o quitarles data...
            //
            const eids2update = recalculateEStatsOf.reduce( (out, eid)=>{

                if( out.indexOf(eid)<0 ) out.push(eid);
                return out;

            } ,[]); 
            
            //
            // actualizar / delete cache of... estos EID...
            //
            if( eids2update.length>0 )
            {
                var updateRes = await __recalculateExerciseStats( eids2update );   
            } 
            //#endregion


            //#region >>> Update "users" table with latest data...
            if( _modifiedLogs.length ) // si se modificaron_logs.....
            {
                //
                // buscar el mas "viejo" la fecha "mayor"
                //
                _modifiedLogs.sort( (a,b)=>b.when-a.when );

                var lastLog         = _modifiedLogs.shift(); 
                const lastLogId     = lastLog.id; 

                // 
                await query(`UPDATE users SET bw=?, idOfLastLog=?, last_log=? WHERE id=?`, [ todaysBW || userKnownBW, lastLogId, new Date(), myId ]); 

            }
            else 
            {
                //
                // if we enter here it means it was probably a DELETE operation only.
                //
                var lastLogPosted = await query(`SELECT * FROM logs WHERE uid=? ORDER BY fecha_del_log DESC, id DESC LIMIT 1`,[myId]);

                if( lastLogPosted.length )
                {
                    await query(`UPDATE users SET bw=?, idOfLastLog=?, last_log=? WHERE id=?`, 
                            [ lastLogPosted[0].bw, lastLogPosted[0].id, lastLogPosted[0].ultima_modificacion, myId ]); 
                }
                else 
                {
                    //
                    // Evertyhing was deleted, no data available at all...
                    //
                    await query(`UPDATE users SET bw=0, idOfLastLog=0, last_log=null WHERE id=?`, [ myId ]); 
                }
            } 
            //#endregion
                
        }
        catch(e)
        {
            //ignore... this error is not relevant to the save operation.
            console.log( e )
        } 


        return true;
    }
}


/** 
 * Por cada **newExercises** lo crea y muta seteando su id.
 * 
 * @param {[{ name:string }]} newExercises 
 * @param {number} uid 
 */
const __createNewExercises = async (tran, newExercises, uid)=>{
  
 
    for (let i = 0; i < newExercises.length; i++) 
    {
        const exercise = newExercises[i];
        
        const result = await tran.query(`INSERT INTO exercises SET ?`, { uid, nombre:exercise.name });
        exercise.id = result.insertId; //<-- y si falla?

        if( !exercise.id )
        {
            throw new Error("Failed to create exercise <"+exercise.name+">");
        }
        else 
        {
            //console.log("Created exercise: ", exercise );
        }
    }
}


/**
 * @param {number} bw  El bodyweight en KILOGRAMS
 * @param {Array} out 
 * @param { { w:{v,lb,usebw:1|-1 }, i:number, r:number, s:number, c:number, rpe, t:number, d:{val:number, unit:string}, type:number }} set 
 */
const __pushInputSetToErowToInsert = (out, set, bw, usekg, erowBase ) => {

    // set.i==0 & set.rpes

    if( set.w?.usebw && !bw )
    {
        throw new Error(`JEDITOR:${set.line} You must specify your bodyweight for the day if you are going to use the "BW" keyword in a set.`);
    }
 
    var v       = set.w?.v || 0; //0.4535924
    var inlbs   = false;
    //
    // si el set no especifica UNIT pero el usuario no usa KG, lo escribió en LBS
    //
    if( set.w?.lb || (set.w?.lb==null && !usekg) )
    {
        v       = lb2kg(v); //<----- convertir el peso en KILOS
        inlbs   = true;
    }

    const usebw = set.w?.usebw; //<-- 1 o -1 sino es CERO. Negative significa que se quitó peso. Ej: elastic bands pullups.

    //
    // puede ser un array si se tipeó en el editor como : @8, 8.5, 10  ...ponele ( RPEs separados pro coma )
    //
    const rpes  = Array.isArray( set.rpe )? set.rpe : set.rpe>0? [ set.rpe ] : null;

    const erow = {
        ...erowBase,
        usedBW      : usebw ? 1 : 0,
        added2BW    : usebw? v * usebw : 0,
        wkg         : usebw? bw + v * usebw : v,
        inlbs       : Number(inlbs),
        reps        : set.r, 
        sets        : set.s,
        comment     : set.c? removeWeirdChars( set.c.trim() ) : "",
        rpe         : rpes? rpes[ set.i || 0 ] : 0, //<--- el RPE que corresponda...
        type        : set.type,
        duration    : set.t ?? 0, // in milliseconds
        distance    : set.d?.val ?? 0, // in cm * 100
        distance_unit: set.d?.unit ?? null
    }

    //
    // caso : 100 x 3 x 3 @ RPE,RPE,RPE <---- Multiple RPEs en un W x R x S
    //
    if( set.i==null && rpes?.length>1 )
    {
        if( set.s != rpes.length )
        {
            throw new Error(`JEDITOR:${set.line} You typed ${rpes.length} RPEs but ${set.s} sets`);
        }

        // por cada rpe...
        rpes.forEach( (rpe, ri) => out.push({
            ...erow,
            rpe,
            sets: 1,
            comment: ri==rpes.length-1? erow.comment : "" //<--- el comment en el ultimo set.
        }));

    }
    else 
    {
        out.push( erow );
    }
    
}



const __deleteLog = async (transaction, logid) => {

    //borrar log
    //borrar todos los mensajes y likes del log...
    await transaction.query(`DELETE FROM logs WHERE id=?`, [logid]);

    var messages = await transaction.query(`SELECT id FROM messages WHERE logid=?`, [logid]);

    if( messages.length )
    {
        const msgids = [messages.map( m=>m.id )];

        await transaction.query(`DELETE FROM messages WHERE id IN ?`,[msgids]);
        await transaction.query(`DELETE FROM message_to WHERE msgid IN ?`,[msgids]); 

        // Likes en LOG
        await transaction.query(`DELETE FROM likes_history WHERE type_id=1 AND source_id=?`,[ logid ]);

        // Likes a mensajes posteados dentro de ese log...
        await transaction.query(`DELETE FROM likes_history WHERE type_id=3 AND source_id IN ?`,[ msgids ]);
    } 
}