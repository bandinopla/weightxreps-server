 
import { dateASYMD, ymd2date } from "../../utils/dateASYMD.js";
import { lb2kg } from "../../utils/lb2kg.js";
import { query, transaction } from "../connection.js";
import { __recalculateExerciseStats } from "./exercises.js"; 



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
         *      { text:string }
         *      { eid, erows:[ { w:{v,lb,usebw:1|-1 }, r, s, c, rpe } ] } 
         *                      w:puede ser un array
         *                      r:puede ser un array
         */

        const deleteYMD = []; //<--- days to delete.
        

        //
        //1) obtener enames (para saber si esta referenciando valid enames)
        //
        const exercises = await query(`SELECT id, nombre FROM exercises WHERE uid=?`, [myId]);
        const knownEids = exercises.map(r=>r.id); //<--- puede ser empty si es la primera vez que guarda algo...
        
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
                                    lastDay = { on:row.on, did:[] };
                                    out.push(lastDay); 
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
                                        lastDay.did.push( row )
                                    }
                                }

                                return out; 
                            },[]);
        //#endregion

        //
        // que comience la magia...
        //
        const tran      = await transaction();  


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


            //
            // acá voy a meter todos los erows a insertar en la tabla erows, con los campos nombrados con el nombre de la columna en mysql
            //
            const erowsToInsert         = [];
            const recalculateEStatsOf   = []; //<--- EIDs de los exercises para recalcular

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


                var usedBW      ;

                //
                // convertir day.did en texto... //!markedForDeletion && 
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
                         console.log( what.eid, "<=0 --->", what.eid<=0 )
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

                    return out;

                } ,"").trim(); 
 

                //#region CREATE or UPDATE log
                //
                // Updating existing LOG
                //
                if( logid )
                {
                    //borrar old EROWS ( necesitamos saber los EIDs borrados para actualizar sus cache... )
                    await tran.query(`DELETE FROM erows WHERE logid=?`,[ logid ]);


                    //
                    // el usuario marcó este día con el tag DELETE o NO HAY NADA EN EL LOG TEXT
                    //
                    if( markedForDeletion )
                    {
                        //
                        // borrar log
                        //
                        await __deleteLog( tran, logid ); 
                        continue;
                    }

                    //
                    // no escribió nada...
                    //
                    else if( logText.length==0 )
                    {
                        throw new Error("Day "+ymd+" is empty... did you forgot to type something? To delete a day you must use the DELETE keyword, this is \"by design\" to make sure you fully understand what you are doing and no accidental deletions occur.");
                    }

                    //update text...
                    await tran.query(`UPDATE logs SET bw=?, log=?, ultima_modificacion=NOW() WHERE id=?`, [ bw || 0, logText, logid ]);
                }

                //
                // Brand NEW LOG!!
                //
                else 
                {

                    if( !logText.length )
                    {
                        throw new Error("The contents for day "+ymd+" is empty... did you forgot to type something?");
                    }

                    // insert new
                    const newLog = await tran.query(`INSERT INTO logs SET ?`, {
                        uid                 : myId,
                        ultima_modificacion : new Date(),
                        fecha_del_log       : ymd,
                        bw: bw || 0,
                        log: logText,
                        fromMobile : 0
                    });

                    logid = newLog.insertId;

                    if( !logid )
                    {
                        throw new Error("Weird... failed to create log "+ymd+" for some reason. Unexpected...")
                    } 
                }
                //#endregion


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
            // EIDs que fueron aftectados por este save, sea para agregarles o quitarles data...
            //
            const eids2update = recalculateEStatsOf.reduce( (out, eid)=>{

                if( out.indexOf(eid)<0 ) out.push(eid);
                return out;

            } ,[]); 
            
            
            //
            // all done!
            //
            await tran.commit(); 


            //
            // actualizar / delete cache of... estos EID...
            //
            if( eids2update.length>0 )
            {
                var updateRes = await __recalculateExerciseStats( eids2update );  
                console.log("UPDATE RES = ", updateRes.affectedRows );
            } 
            
        }

        //
        // on error abort transaction...
        //
        catch( e )
        { 
            console.log("ABORT!!");
            console.error(e)
            await tran.abort( "Aborted because of ----> "+String(e) );
        } 


        //
        // todo guardado! update users row...
        //
        //if( todaysBW )
        //{
            try 
            {
                //actualizar lastlog y idDeLastLog....  



                if( _modifiedLogs.length ) // si se modificaron_logs.....
                {
                    //buscar el mas "viejo" la fecha "mayor"
                    _modifiedLogs.sort( (a,b)=>b.when-a.when );

                    var lastLog         = _modifiedLogs.shift(); 
                    const lastLogId     = lastLog.id; 

                    //
                    
                    await query(`UPDATE users SET bw=?, idOfLastLog=?, last_log=? WHERE id=?`, [ todaysBW || userKnownBW, lastLogId, new Date(), myId ]); 

                }
                else 
                {
                    //no hay nada... por ahi solo borró. Hay que buscar ahora el ultimo logged....
                    //
                    var lastLogPosted = await query(`SELECT * FROM logs WHERE uid=? ORDER BY fecha_del_log DESC, id DESC LIMIT 1`,[myId]);

                    if( lastLogPosted.length )
                    {
                        await query(`UPDATE users SET bw=?, idOfLastLog=?, last_log=? WHERE id=?`, 
                                [ lastLogPosted[0].bw, lastLogPosted[0].id, lastLogPosted[0].ultima_modificacion, myId ]); 
                    }
                    else 
                    {
                        // o poner todo en cero... 
                        await query(`UPDATE users SET bw=0, idOfLastLog=0, last_log=null WHERE id=?`, [ myId ]); 
                    }
                } 
                 
            }
            catch(e)
            {
                //ignore...
            }
        //}


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
            console.log("Created exercise: ", exercise );
        }
    }
}


/**
 * @param {number} bw  El bodyweight en KILOGRAMS
 * @param {Array} out 
 * @param { { w:{v,lb,usebw:1|-1 }, i:number, r:number, s:number, c:number, rpe }} set 
 */
const __pushInputSetToErowToInsert = (out, set, bw, usekg, erowBase ) => {

    // set.i==0 & set.rpes

    if( set.w.usebw && !bw )
    {
        throw new Error(`JEDITOR:${set.line} You must specify your bodyweight for the day if you are going to use the "BW" keyword in a set.`);
    }
 
    var v       = set.w.v; //0.4535924
    var inlbs   = false;
    //
    // si el set no especifica UNIT pero el usuario no usa KG, lo escribió en LBS
    //
    if( set.w.lb || (set.w.lb==null && !usekg) )
    {
        v       = lb2kg(v); //<----- convertir el peso en KILOS
        inlbs   = true;
    }

    const usebw = set.w.usebw; //<-- 1 o -1 sino es CERO. Negative significa que se quitó peso. Ej: elastic bands pullups.

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
        comment     : set.c.trim(),
        rpe         : rpes? rpes[ set.i || 0 ] : 0 //<--- el RPE que corresponda...
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