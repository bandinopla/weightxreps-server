import { UserFieldsManager } from "./inbox.js";
import { query } from "../connection.js";
import { uidIsAdmin } from "../directives/AccessRestrictionDirective.js";
import extractUserDataFromRow from "../../utils/extractUserDataFromRow.js";
import { getAllOfficialEnames, getAllOfficialETags, ename2type } from "../../utils/ename2type.js";
import { GraphQLScalarType } from "graphql";
import { UserInputError } from "apollo-server-express";
import { dateASYMD, ymd2date } from "../../utils/dateASYMD.js";
import { getPRsOf, JS_1RM_FORMULA, ORIGINAL_1RM_FACTOR, sql1RMFormula, SQL_SELECTING_CUSTOM1RM_FROM_USERS } from "./exercises.js";
import { SaveJournalResolver } from "./save-journal.js";
import { rpePercentLeftJoin } from "./rpe.js";
import { decode } from 'html-entities';
import { ExercisesResolver } from "./exercises.js";
import { getUTags, getUTagsRangeData } from "./tags.js";
import { WxDoT_DistanceOf, WxDoT_ForceOf, WxDoT_SpeedOf, WxDoT_GQLErowFields } from "./weight_x_distance_or_time.js";
import * as emoji from 'node-emoji'
import {  getForumStatusJsObject , getForumRoleById } from "./forum.js";

/**
 * Devuelve la info del usuario si no estamos ni bloqueados ni el usuario que se pide es privado.
 * @param {Object|String|Number} requestedUserIdentifier Un urow resultado de select * from user, un id o uname...
 * 
 */
export const GetUserInfo = async ( requestorUID, requestedUserIdentifier, identifierIsUname=false ) => {

    var row;
    
    if( requestedUserIdentifier?.id )
    {
        row = requestedUserIdentifier;
    }
    else 
    { 
        let searchParam       = identifierIsUname? "uname" : "id";   

        const result      = await query(`SELECT * FROM users WHERE ${searchParam}=? AND deleted=0 LIMIT 1`, [requestedUserIdentifier]); 
        row = result[0];
    } 

    if( !row )
    {
        throw new Error("Can't find that user...");
    }
    
    const isAdmin = uidIsAdmin(requestorUID);

    var user    = { ...extractUserDataFromRow(row)

                    , custom1RM             : row.custom1RM 
                    , est1RMFactor          : row.custom1RM || ORIGINAL_1RM_FACTOR 
                    , estimate1RMFormula    : JS_1RM_FORMULA
                    , bday                  : row.bday
                    , hidebw                : row.hidebw //mostrar o no el BW...
                    , canShowBW             : ()=>row.hidebw==0 || (user.id == requestorUID || isAdmin)
                    , daysLeft              : row.days_left_as_supporter
                    , socialLinks           : (await query(`SELECT url FROM \`social-links\` WHERE uid=? ORDER BY id ASC`, [row.id]))
                                                .map( r=>r.url )
                };

        if( user.sok )
        {
            // TODO Available #JRANGES
            user.jranges = [18, 20, 32]; // allowed extra jranges.
        } 


    if( user.id == requestorUID || isAdmin ) 
        return user;
    

    if( user.private )
        throw new Error("User has private mode turned ON (that means you can't see it ^_^)");

    //
    // si tiene bloqueado a alguien
    //
    if( requestorUID && row.blockedusers.length )
    {
        let blocks          = row.blockedusers.split(",").map(uname=>uname.trim());
        let blockedResult   = await query(`SELECT id FROM users WHERE id=? AND (( uname IN (?) ) OR (email IN (?))) LIMIT 1`, [ requestorUID, blocks, blocks ]);

        if( blockedResult.length ) 
            throw new Error("User unavailable...");
    }

    return user;

}


/**
 * 
 * @param {number} uid Id del usuario...
 * @returns { [ { wkg:number, ename:string, eid:number, type:string } ] }
 */
const GetBestOfficialLiftsOf = async ( uid, onlyTheseTypes )=>{

    let officialEnames  = getAllOfficialEnames(onlyTheseTypes);
    let officialETags   = getAllOfficialETags(onlyTheseTypes);

    let result = await query(`  SELECT 
                                    MAX(A.wkg) AS wkg, 
                                    B.nombre AS ename, 
                                    B.id AS eid

                                FROM erows AS A 
                                INNER JOIN exercises AS B ON B.id=A.eid  
                                WHERE 
                                    A.uid=? 
                                    AND A.reps>0 AND A.type=0
                                    AND (B.nombre IN (?) OR ${ officialETags.map( tag=>`B.nombre LIKE '%${tag}' OR B.nombre LIKE '%${tag} %'` ).join(" OR ") })
                                    
                                GROUP BY B.id 
                                ORDER BY wkg DESC`, [ uid, officialEnames ]);
 
    return result.map( row => ({
        ...row,
        type: ename2type( row.ename )
    }));
}


export const JournalResolver = {



    CalendarDayKey: new GraphQLScalarType({
        name            : "CalendarDayKey",
        description     : 'YYYYMMDDx where "x" is 0-1',
        serialize       : value => value,
        parseValue      : value => {
            
            let ymd = String(value);
            
            if( ymd.match(/^\d{8}[0-1]$/) ) {

                let d       = new Date( ymd.substr(0,4), Number(ymd.substr(4,2))-1, ymd.substr(6,2) );
                let check   = (d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate()).toString();

                if( ymd.indexOf(check)==0) 
                {
                    return value;
                } 
            }

            throw new UserInputError("Invalid date! must be YYYYMMDDx (where 'x' is either 0 or 1");
        }
    }),

    ESet: new GraphQLScalarType({
        name            : "ESet",
        description     : 'Exercise set definition...',
        serialize       : erow => {

            //
            //----> erow es un row de la tabla "erows" + isPR:Boolean
            //
            var w       = erow.wkg;
            const unit  = erow.inlbs?"l":0;

            if( erow.usedBW ) 
            {
                if( erow.added2BW==0 ){
                    w = "BW";
                }
                else 
                {
                    w = "BW"+(erow.added2BW>0?"+":"")+(erow.added2BW+unit);
                }
                
            }
            else 
            {
                w += unit;
            } 

            if( erow.isPR )
            {
                w = "!"+w.toString();
            }


            var set = w;

            if( erow.reps!=1 || erow.sets>1 ) 
            {
                set = [set, erow.reps];
            }

            if( erow.sets>1 ) {
                set.push(erow.sets);
            }

            if( erow.comment.trim().length>0 ) {
                if( !Array.isArray(set) ) {
                    set = [set];
                }
                set.push(erow.comment);
            } 

            return set;


        },
        // parseValue      : value => {
             
        // }  
    }),


    Query: {
        userBasicInfo: async ( parent, args, context )=> {

            const locators  = args.of? [args.of] : args.ofThese;

            const urows     = await query(`SELECT * FROM users WHERE id IN (?) OR uname IN (?)`,[ locators, locators ]);
 
            if( !urows.length )
            {
                throw new Error("Nothing found..."); 
            } 

            return urows.map( row=>{

                const user = extractUserDataFromRow( row );

                delete user.bw;
                delete user.age; 

                return user;

            });
        },

        userInfo: async ( parent, args, context )=> { 

            let myId        = context.session?.id; 
            let user        = context.userInfo; //await GetUserInfo( myId, args.uname );
            let chosenBests = ["SQ","BP","DL"];

            //daysLogged
            let daysLogged  = await query("SELECT COUNT(DISTINCT fecha_del_log) AS total FROM logs WHERE uid=?",[ user.id ]);

            //best 3... donde ename in .... 
            let bestLifts       = await GetBestOfficialLiftsOf( user.id, chosenBests );
            let bestOfEachTag   = bestLifts.reduce( (dicc, lift)=>{

                if( !dicc[lift.type] )
                {
                    dicc[lift.type] = lift;
                }

                return dicc;

            } ,{}); 


            if( !user.canShowBW() )
            {
                user.bw = 0;
            }

 
            return {
                user, 
                daysLogged: daysLogged[0]?.total || 0,
                forum: await getForumStatusJsObject( user ),
                best3: chosenBests
                             .map( etype=>{

                                 let ex = bestOfEachTag[etype] ; 

                                 if( !ex ) return null;

                                 return {
                                    w: ex?.wkg || 0,
                                    e: { 
                                        id      : ex.eid, 
                                        name    : ex.ename, //getAllOfficialEnames([ etype ])[0],
                                        type    : etype
                                    }
                                 }
                            }) 
                            .filter( e=>e!=null )
            }
        },

        getCalendarDays: async (parent, args, context) => {
 
            //throw new Error("testing")
            let from    = args.from.replace(/^(\d{4})(\d{2})(\d{2})$/,"$1-$2-$3");
            let to      = args.to.replace(/^(\d{4})(\d{2})(\d{2})$/,"$1-$2-$3");

            let logs    = await query(`SELECT fecha_del_log FROM logs WHERE uid=? 
                                        AND fecha_del_log >= '${from}' AND fecha_del_log <= '${to}'
                                        ORDER BY fecha_del_log ASC`,[ args.uid ]);

            //
            // ir de "from" a "to" 
            //
            from                = new Date( Date.UTC( from.substr(0,4), Number(from.substr(5,2))-1, from.substr(8) ));
            to                  = new Date( Date.UTC( to.substr(0,4), Number(to.substr(5,2))-1, to.substr(8) ));  
            let daysWithData    = logs.map( row=> dateASYMD(row.fecha_del_log, true).replace(/\D/g,"") ); 
            let rtrn            = [];
 

            while(from<=to) 
            {
                let key         = dateASYMD(from, true).replace(/\D/g,"");
                let hasData     = daysWithData.find(day=>day==key) != null;

                from.setDate( from.getDate()+1 );

                rtrn.push( key + Number(hasData) );
            }

            return rtrn;
        },

        getYearOverview: async( parent, args, context) => {

            const d0 = new Date( args.year, 0, 1 );
            const dF = new Date( args.year+1, 0, 0); 
    
            d0.setDate( d0.getDate() - d0.getDay() );  
            dF.setDate( dF.getDate() + (6 - dF.getDay()) ); 

            const diffMs = dF - d0;
            const differenceInDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const weeks = Math.ceil( differenceInDays/7 ) ; 

            let days = await query(`SELECT logs.fecha_del_log, SUM( erows.wkg*erows.reps*erows.sets ) AS volume
                                        FROM logs 
                                        LEFT JOIN erows ON erows.logid=logs.id
                                        WHERE logs.uid=? AND logs.fecha_del_log BETWEEN ? AND ?
                                        GROUP BY logs.id 
                                        ORDER BY logs.fecha_del_log ASC`, [ args.uid, dateASYMD(d0, true), dateASYMD(dF, true) ]);

            let maxVolume = days.reduce( (old, v)=>Math.max(old,v.volume) ,0);
            let minVolume = days.reduce( (old, v)=>Math.min(old,v.volume) ,Number.MAX_VALUE); 
 

            return new Array( weeks*7 ).fill(0).map( (_,i)=>{

                const day = new Date(d0);
                day.setDate( day.getDate() + i);

                const dayVolume = days.find( d=>d.fecha_del_log.getUTCFullYear()==day.getFullYear() &&  d.fecha_del_log.getUTCMonth()==day.getMonth() &&  d.fecha_del_log.getUTCDate()==day.getDate()) ;
  
                return dayVolume? 1 + ( dayVolume.volume? Math.round((dayVolume.volume/maxVolume)*3) : 0 )  : 0;

            });

        },

        getYearsLogged: async( parent, args, context) => {
            const years = await query(`SELECT YEAR(logs.fecha_del_log) as year FROM logs WHERE logs.uid=? GROUP BY year ORDER BY year ASC`, [args.uid]);
            return years.map(row=>row.year);
        },

        jday: async (parent, args, context)=>{

            const ymd = args.ymd;
            const uid = context.userInfo.id; //porque se usa la directive @UserMustAllow que injecta eso

            //
            // get log
            // get erows innerjoneando con exercise...
            // necesitamos los mejores lifts para esos dias...
            //
            var log = await query(`SELECT * FROM logs WHERE uid=? AND fecha_del_log=? LIMIT 1`, [ uid, ymd ]);

            //
            // A log can be empty. As @azothriel mentioned that she sometimes wants to save an empty workout to log the bodyweight...
            // so log can be ""
            //
            if( !log.length ) //should never happen but... just in case...
                     return; 

            //
            // obtener el unico row
            //
            log = log[0];

            const eids          = [];
            const exercises     = [];
            const eblocks       = [];
            const eid2eref      = new Map();

            //#region fill "eids" array. collect EIDs del texto del log...
            const regex = /EBLOCK:(\d+)/gm;
            const str   = log.log;
            let m;
            
            while ((m = regex.exec(str)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                 
                const eid = m[1];
                
                if( eids.indexOf(eid)<0 )
                {
                    eids.push(eid);
                }
            }
            //#endregion
 

            //
            // FIND REFERENCED EXERCISES
            //
            if( eids.length>0 )
            { 

                var refExercises = await __getReferencedExercises( eids ); 

                refExercises.forEach( e=>{

                    const eref = { 
                        //
                        // pueden ser NULL si es la primera vez que hace el ejercicio por ejemplo.
                        // eff puede ser NULL tambien si no se puede calcular 1RM porque metio mas de 10 reps en un set.
                        //
                        best: { eff:null, int: null },  
                        exercise: e
                    };
 
                    eid2eref.set( e.id, eref ); 
                    exercises.push( eref );
                }); 
 

            //----
            // FIND PRs y calcular BEST EFF INT
            //----

            //#region get PRs history for each EID
            const prs = new Map(); //get PRs history of each exercise... Key:eid  value:PRs 

            for ( let i = 0; i < exercises.length; i++ ) 
            {
                const e         = exercises[i];
                const _eid      = Number( e.exercise.id ); 

                try
                { 
                    //
                    // obtener PRs de este ejercicio para fechas menores al YMD
                    //
                    var PRsOfEID = await getPRsOf( uid, _eid, log.fecha_del_log );
                    prs.set( _eid, PRsOfEID );  

                }
                catch(err) 
                {
                    // ignore error... 
                } 
                
                //
                // Calcular exercise's BEST EFF & INT
                // puede ser que no tenga si es nuevo o el primer workout!!
                // 
                if( PRsOfEID )
                {
                    let [eff, int]  = PRsOfEID.getBestEffInt();

                    e.best.eff      = eff; // <-- puede ser null...
                    e.best.int      = int;  

                    e.best.prsWxDorT = PRsOfEID.prsWxDorT.getBestStats(); 
                }

                //
                // si no hay info historica de EFF, calcularla con la info del día.
                //
                if( !e.best.eff ) {
                    e._calculateDayEffAsBest = true;
                } 

                //
                // si no hay info historica de INT, calcularla con la info del día.
                //
                if(!e.best.int) {
                    //e.best = null; //si no hay INT, no hay nada.
                    e._calculateDayIntAsBest = true;
                }
            } 
            //#endregion
            
            /** si e.best==null tenemos que calcular el bestEFF e INT con la información del día! */


            //#region EROWS....
                const erows         = await query(`SELECT *,
                                                        #
                                                        # estimated 1RM usando la formula del usuario
                                                        #
                                                        ${sql1RMFormula("erows.wkg","erows.reps","C.custom1RM","RPE.rpePercent")} AS est1rm

                                                        FROM erows 
                                                        INNER JOIN ( ${SQL_SELECTING_CUSTOM1RM_FROM_USERS} ) AS C ON C.id=erows.uid


                                                        ${ rpePercentLeftJoin("RPE","erows.reps", "erows.rpe") }
                                                       

                                                        WHERE uid=? AND logid=? 
                                                        ORDER BY erows.id ASC`
                                                        ,[ uid, log.id ]);

                var currentBlock    = -1;
                var eblock; 
                
                //
                // por cada erow, calcular si hizo PR o no.
                //
                for( var i=0; i<erows.length; i++ ) {

                    const erow = erows[i];
                    const eref = eid2eref.get(erow.eid);

                    if( !eref )
                    {
                        //console.log("EREF null para EID: ", erow.eid );
                        continue;
                    }

                    //
                    // definir en qué block estamos. (caso por ejemplo que loguees squat A.M. session seguido de P.M. session... todos serían del mismo eid pero working sets separados)
                    //
                    if( currentBlock!=erow.block ) 
                    {
                        currentBlock    = erow.block;
                        eblock          = {
                            eid : erow.eid,
                            sets: []
                        };

                        eblocks.push(eblock);
                    }

                    //
                    // este set es un PR set?
                    //
                    const isPR  = __erowEsPR( erow, erows, prs.get(erow.eid)?.isRMPR ); 
                    const set   = { ...erow, isPR };  

                    //
                    // hay que calcular el best EFF del día? (caso que no tenga eff histórico)
                    //
                    if( eref._calculateDayEffAsBest && set.type==0 )
                    {
                        // este sería el "best eff" del día si este erow fuera el "mejor"
                        let setEff = {
                            w       : set.wkg,
                            r       : set.reps,
                            lb      : set.inlbs,
                            when    : log.fecha_del_log, 
                            bw      : log.bw,
                            est1rm  : set.est1rm
                        }

                        //
                        // si el exercise no tiene info de EFF o tiene pero es menor al actual.
                        //
                        if( !eref.best?.eff || (setEff.est1rm>0 && eref.best.eff.est1rm<setEff.est1rm) )
                        {
                            //
                            // crear "best" si no existe...
                            //
                            //if( !eref.best ) eref.best = { eff:null, int:null };

                            //
                            // setear este como mejor eff
                            //
                            eref.best.eff = setEff;
                        }
                    }

                    //
                    // hay que calcular el best INT del día? (caso que no tenga int histórico)
                    //
                    if( eref._calculateDayIntAsBest && set.type==0 )
                    {
                        // este sería el "best eff" del día si este erow fuera el "mejor"
                        let setInt = {
                            w       : set.wkg,
                            r       : set.reps,
                            lb      : set.inlbs,
                            when    : log.fecha_del_log, 
                            bw      : log.bw 
                        }

                        //
                        // si el exercise no tiene info de EFF o tiene pero es menor al actual.
                        //
                        if( !eref.best?.int || (setInt.w>0 && setInt.r>0 && eref.best.int.w<setInt.w) )
                        {
                            //
                            // crear "best" si no existe...
                            //
                            // if( !eref.best ) eref.best = { eff:null, int:null };

                            //
                            // setear este como mejor eff
                            //
                            eref.best.int = setInt;
                        }
                    }
 
                    eblock.sets.push( {
                        w   : set.wkg,
                        r   : set.reps,
                        s   : set.sets,
                        lb  : set.inlbs,
                        ubw : set.usedBW,
                        c   : emoji.emojify( set.comment ) ,
                        rpe : set.rpe, //<- puede ser 0 
                        pr  : set.isPR? 1 : 0,
                        est1rm: set.est1rm,


                        
                        // type: set.type,
                        // t : set.duration, // in milliseconds
                        // d : set.distance, // in cm*100
                        // dunit : set.distance_unit, 

                        // speed   : WxDoT_SpeedOf(set), // meters per second or 0 
                        // force   : WxDoT_ForceOf(set), // Newtons 
                        ...WxDoT_GQLErowFields(set)
                    }); 
                }; 


                //
                // setear el eff / int de cada set...
                //
                eblocks.forEach( eblock=>{

                    const best = exercises.find(eref=>eref.exercise.id==eblock.eid)?.best;

                    best && eblock.sets.forEach( set => {
                        set.int = best.int?.w ? set.w / best.int.w : 0;
                        set.eff = best.eff?.est1rm ? set.est1rm / best.eff.est1rm : 0;
                    });

                });
                
            //#endregion
            }

            const [ utags, utagsValues ] = await getUTags(uid, [ log.id ], true);

            return {
                id          : log.id,
                log         : emoji.emojify(log.log) ,
                fromMobile  : log.fromMobile==1,
                bw          : context.userInfo.canShowBW()? log.bw : 0, // El BW se saca siempre del journal post... || context.userInfo.bw
                eblocks,
                exercises,
                utags,
                utagsValues
            }

        },

        alsoposted: async(parent, args, context)=>{

            const limit             = 20;
            const ymd               = args.ymd;
            const USER              = new UserFieldsManager("A","");
            const alsoPosted        = await query( `SELECT ${USER.userFieldsQuery() }  
                                                    FROM users AS A
                                                    INNER JOIN logs ON logs.uid=A.id 
                                                    WHERE 
                                                            A.private=0
                                                        AND A.deleted=0
                                                        AND logs.fecha_del_log=?
                                                        
                                                    ORDER BY logs.ultima_modificacion DESC
                                                    LIMIT ${limit}`, [ymd]);
 
            return alsoPosted.map( row =>USER.extractUserData(row) );

        },

        jrange: async(parent, args, context)=>{

            const uid       = context.userInfo.id; 
            const myid      = context.session?.id;
            const exercises = [];
            const days      = []; 
            const to        = args.ymd;
            const from      = _getYMDfromRange( args.ymd, args.range, context.userInfo, myid );

            //
            // devolver todos los erows en el rango solicitado
            //
            var erows     = await query(`SELECT  
                                                eid, 
                                                nombre AS ename,  
                                                wkg, 
                                                erows.reps, 
                                                sets, 
                                                fecha_del_log,
                                                inlbs,
                                                usedBW,

                                                type,
                                                distance, 
                                                distance_unit,
                                                duration,

                                                #
                                                # estimated 1RM usando la formula del usuario
                                                #
                                                ${sql1RMFormula("wkg","erows.reps","C.custom1RM", "RPE.rpePercent")} AS est1rm 
            
                                            FROM erows
                                            INNER JOIN ( ${SQL_SELECTING_CUSTOM1RM_FROM_USERS} ) AS C ON C.id=erows.uid
                                            INNER JOIN exercises ON exercises.id=erows.eid
                                            INNER JOIN logs ON logs.id=erows.logid 

                                            ${ rpePercentLeftJoin("RPE","erows.reps","erows.rpe") }
                                            
                                            WHERE erows.uid=? 
                                                AND fecha_del_log BETWEEN ? AND ?

                                            ORDER BY fecha_del_log ASC, erows.block ASC, erows.id ASC`, [uid, from, to]);



            const eid2PRs   = new Map();
            const eids      = erows.map(r=>r.eid);

            //
            // obtener PRs info de cada exercise
            //
            for (let i = 0; i < eids.length; i++) 
            {
                const eid = eids[i];

                //
                // dame los PRs de este exercise...
                //
                try
                {  
                    var PRsOfEID = await getPRsOf( uid, eid );

                    eid2PRs.set( eid, PRsOfEID ); 
                }
                catch(e) 
                {
                    // ignore error... 
                    continue;
                } 
            }


            //
            // SET  erow.isPR 
            // calcular si cada set es PR o no...
            //
            erows = erows.map( erow=>({
                ...erow,
                isPR: __erowEsPR(   erow, 
                                    erows, 
                                    (w,r)=>eid2PRs.get(erow.eid)?.isRMPR( w, r, erow.fecha_del_log ) 
                                )
            }));


            //
            // collect data...
            //
            erows.forEach( erow=> {

                const ymd   = erow.fecha_del_log;  
                var day     = days.find( d => d.on.valueOf()==ymd.valueOf() );

                if( !day )
                {
                    day = {
                        on:ymd, did:[]
                    };

                    days.push(day);
                } 
 

                // agregar los sets al block...
                var block = day.did.find(b=>b.eid==erow.eid);

                if( !block )
                {
                    block = { eid: erow.eid, sets:[] };
                    day.did.push( block );
                }

                block.sets.push({ 
                    w: erow.wkg, 
                    r: erow.reps,
                    s: erow.sets,
                    lb: erow.inlbs,
                    ubw: erow.usedBW,  
                    pr      : Number( erow.isPR ), 
                    est1rm  : erow.est1rm,

                    ...WxDoT_GQLErowFields(erow)
                });  

                //
                // lazy init. Exercise...
                //
                if( !exercises.find(e=>e.id==erow.eid) )
                {
                    exercises.push({
                        id  : erow.eid,
                        name: erow.ename,
                        type: ename2type(erow.ename)
                    });
                }

            });//end forEach erows



            // si no hay días, no hay nada.
            //
            //
            if( days.length )
            {
                //
                // le mete "eff" & "int"  a cada EROW...
                //
                await __jrangeCalculateEffInt( eid2PRs, exercises, days );
            } 
            
            
            //
            // oka!
            //
            return {
                from, to,
                exercises,
                days,
                utags: await getUTagsRangeData( uid, from, to )
            }
        },

        jeditor: async(parent, args, context)=> {

            const myid      = context.session.id;
            const to        = args.ymd;
            const from      = args.range>0? _getYMDfromRange( args.ymd, args.range, context.userInfo, myid ) : args.ymd;

            //
            // Base BW. Si se llega a usar BW, necesitamos saber el BW del usuario...
            //
            const baseBW    = args.all? 0 : await getLastKnownBW(myid, from); 

            // get journal logs

            const logs      = await query( args.all?  `SELECT * FROM logs WHERE uid=? ORDER BY fecha_del_log ASC` 
                                                    : `SELECT * FROM logs WHERE uid=? AND fecha_del_log BETWEEN ? AND ? ORDER BY fecha_del_log ASC`, [ myid, from, to ]);
            
            // logids de los que hay que cargar erows...
            const logids                    = [];
            const eids                      = []; 
            const [knownUTags, utagsValues] = await getUTags( myid, logs.map( log=>log.id ) );

            // get erows
            //const erows     = await query(`SELECT * FROM erows WHERE logid IN (?) ORDER BY id ASC`, [ logids ]);

            var rows        = []; 
            var exercises   ; //<-- referenced exercises
            var lastBW      = baseBW;
            //
            

            //por cada log....
            //crear los tags...
            logs.forEach( log=>{

                const str       = log.log;

                // if( !str.trim().length )
                // {
                //     return; // EMPTY log, skip...
                // }

                // Day Tag
                rows.push({ __typename:"JEditorDayTag", on:log.fecha_del_log });

                if( log.bw )
                {
                    lastBW = log.bw || lastBW;

                    //el que diga el log o se usará el anterior...
                    rows.push({ __typename:"JEditorBWTag", bw: lastBW   });
                }
 
                //#region UTAGS
                const regex     = /(UTAG|EBLOCK):(\d+)/gm;
                
                let m;
                
                let lastIndex   = 0;
                var blockIndex  = 0;
                //
                // por cada EBLOCK detectado..
                //
                while ((m = regex.exec(str)) !== null) { 

                    const tagType = m[1];
                    const tagID = parseInt(m[2]);

                    // This is necessary to avoid infinite loops with zero-width matches
                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    } 
                       
                    // text row
                    const txt = str.substr(lastIndex, m.index-lastIndex).trim();

                    if( txt.length )
                    {
                        rows.push({ __typename:"JEditorText", text: txt });
                    }

                    lastIndex = m.index + m[0].length;

                    if( tagType=='EBLOCK')
                    {
                        const eid = tagID; 

                        // LOGID
                        logids.indexOf(log.id)<0 && logids.push( log.id );

                        // EID
                        eids.indexOf(eid)<0 && eids.push(eid);
                        
                        rows.push( { __typename:"JEditorEBlock", e:eid, block:blockIndex,  logid:log.id, sets:[] } );

                        blockIndex++;
                    }

                    //
                    // ignore "broken" references (happens when you delete a tag)
                    //
                    else if( tagType=='UTAG'  )
                    {
                        //&& knownUTags.find(utag=>utag.id==tagID)

                        const tval = utagsValues.find(t=>t.id==tagID);

                        if( tval )
                        { 
                            rows.push( {
                                ...tval,
                                __typename: "UTagValue"
                            });
                        } 
                        
                    } 
                        
                } 
 
                const txt = str.substr(lastIndex).trim();
                if( txt.length )
                {
                    rows.push({ __typename:"JEditorText", text: str.substr(lastIndex).trim() });
                }
                
                //#endregion


            } );//end:forEach log


            //
            // no hay logs...
            //
            if( !logs.length )
            {
                rows.push({ __typename:"JEditorDayTag", on:args.ymd }); 
                lastBW && rows.push({ __typename:"JEditorBWTag", bw:lastBW });
            } 
            

            // hay que cargar erows??
            if( eids.length )
            {
                // ordenarlos por ID nos asegura que esten en orden de aparicion. El orden por día ya se hizo arriba...
                const erows     = await query(`SELECT * FROM erows WHERE logid IN (?) ORDER BY id ASC`, [ logids ]); 

                erows.forEach( erow=>{

                    const eblock = rows.find(row=> row.logid==erow.logid && row.e==erow.eid && row.block==erow.block );

                    if(!eblock)
                    {
                        // wtf?????? Si el jlog no hizo referencia a este erow, significa que está "perdido". Nada apunta a él. 
                        return;
                    }

                    const set = {

                        v: erow.usedBW? erow.added2BW : erow.wkg, 
                        r: erow.reps,
                        s: erow.sets,
                        c: erow.comment,
                        rpe: erow.rpe,
                            
                        ...WxDoT_GQLErowFields(erow) 
                    };

                    if( erow.usedBW )
                    {
                        set.usebw = 1;
                    }

                    if( erow.inlbs )
                    {
                        set.lb = 1;
                    }

                    //agregar el set...
                    eblock.sets.push(set); 

                }); 
                
            }


            // cargar la info de los exercises referenciados...
            // exercises = await __getUserExercises(myid); 
            exercises = await ExercisesResolver.Query.getExercises( parent, { uid:myid }, context );

            
            if( args.showMissing )
            { 
                //
                // if the exercise referenced can't be found, flag it as missing.
                // this should not happen but just in case...
                //
                rows.filter( row=>row.__typename=='JEditorEBlock' && !exercises.find(edef=>edef.e.id==row.e))

                    //
                    // create a dummy exercise for this broken link
                    //
                    .forEach( eblock => {

                        let ex = exercises.find(edef=>edef.e.id==eblock.e);

                        if( !ex )
                        {
                            ex = {
                                e: {
                                    id: eblock.e,
                                    name: `Missing Exercise (id:${eblock.e})`
                                },
                                days:0, reps: 0
                            };

                            exercises.push(ex)
                        }

                    });
            }
            else 
            {
                rows = rows.filter( row=>row.__typename!='JEditorEBlock' || exercises.find(edef=>edef.e.id==row.e));
            }
            
            //
            // remove empty sets... again it should not happen but just in case...
            //
            // rows = rows.filter( row=>row.__typename!='JEditorEBlock' || row.sets.length>0 );



            return {
                did     : rows, 
                etags   : getAllOfficialETags(),
                utags   : knownUTags,
                baseBW,
                exercises
            }
        },

        downloadLogs: async (parent, args, context) => {

            const myId          = context.session.id;  
            const canDownload   = context.userInfo.sok; 
            //todo: if SOK only....

            if( !canDownload )
            {
                // que todos puedan descargar...
                //throw new Error("You must be an active supporter to use this feature!");
            }

            return await JournalResolver.Query.jeditor(parent, { all:true, showMissing:true }, context); 
        }

        
    },

    Mutation: {
        ...SaveJournalResolver

        
    }
}

/**
 * Devuelve el último known exercise de este usuario antes de esa fecha.
 */
export const getLastKnownBW = async (uid, ymd)=>{

    var baseBW = await query(`SELECT bw FROM logs WHERE uid=? AND bw>0 AND fecha_del_log<? ORDER BY fecha_del_log DESC LIMIT 1`, [uid, ymd]);
    return baseBW.length? baseBW[0].bw : 0; // y bueh....
}

const _getYMDfromRange = ( ymd, range, userInfo, requestorUID )=>{ 

    //#region Validate RANGE
    if( range>16 )
    {  
        //
        // solo permitir si esta "activo" y es su propio journal.
        //
        if( userInfo.sok && requestorUID==userInfo.id )
        {

            //
            // tomamos el ultimo valor (que es el mayor posible)
            //
            const maxRange = userInfo.jranges.slice(-1)[0]; 

            //
            // el rango está dentro de los disponibles...
            //
            if( range > maxRange )
            { 
                throw new Error("Invalid range (not within the expected range of [ 1 to "+userInfo.jranges.slice(-1)[0]+" ]). Received [ "+range+" ]"); 
            }

        }
        else 
        {
            throw new Error("NOTSOK");
        } 
    }
    //#endregion


    let d = new Date( ymd2date(ymd) );
        d.setDate( d.getDate() - range*7 + 1 );
    
    return dateASYMD( d );
}


/**
 * 1) chequea si el **erow** es el mejor WxR dentro de **erows**
 * 2) if `true` : chequea contra `isRMPR` (if not null) y si devuelve `true` se considera `true`
 * 3) else: devuelve el boolean del paso 1
 *  
 * 
 * @param { { eid:number, wkg:number, reps:number } } erow 
 * @param {[{ eid:number, wkg:number, reps:number }]} erows se asume que erow esta dentro de erows. Y que son todos del mismo día.
 * @param {(w:number, r:number)=>boolean} isRMPR la funcion async a llamar que nos dice si es PR o no
 * @param {Boolean} prsof 
 */
const __erowEsPR = ( erow, erows, isRMPR=null ) => {

    if( erow.reps<=0 || erow.type!=0 ) return false; 
    

        //
        // comparar contra todos los sets del dia...
        // estan ordenados en orden cronologico. el primer match es el primero en cuanto a cronologia.
        //
 

        //
        // analizamos TODOS los erows y buscamos uno que SUPERE o IGUALE el current erow.
        //
        var best = erows.reduce( (best, row)=>{ 

            //
            // si llega a tener esa prop, deben ser todos iguales
            //
            if( erow.fecha_del_log!=row.fecha_del_log )
            {
                return best;
            }

            // if( best?.eid!=erow.eid ) //<---- porque puse eso??? no me acuerdo
            // {
            //     best = null;
            // }

            //
            // su rows >= erow
            //
            if( row.eid==erow.eid && row.wkg>=erow.wkg && row.reps>=erow.reps )
            {
                //
                // este segundo IF es porque quiero el PRIMER erow que supere. Si no lo pusiera,
                // se quedaría con el último, instead.
                //
                if( best && best.wkg>=row.wkg && best.reps>=row.reps )
                {
                    // el primero en entrar queda. Porque vienen en orden cronologico.
                    return best;
                }
                else 
                {
                    return row;
                }
            }

            return best; 

        });

        
        //
        // es PR! el mejor erow del día...
        //
        if( best == erow )
        { 
            //
            // ahora chequear si el PR es valido en comparación con el pasado.
            //
            const stillPR = isRMPR? isRMPR( erow.wkg, erow.reps ) : null;

            //
            // si es NULL se asume que no hay punto de comparación con el pasado.
            //
            if( typeof stillPR == 'boolean' )
            {
                return stillPR;
            }
            else 
            {
                //
                // si no hay "isRMPR" nos quedamos con la comparación contra los erows del día.
                //
                return true;
            } 
        } 


    return false;
}




const __jrangeCalculateEffInt = async ( eid2PRs, exercises, days ) => { 

    //
    // por cada exercise...
    //
    for (let i = 0; i < exercises.length; i++) 
    {
        const eid   = exercises[i].id; 
        const prs   = eid2PRs.get(eid); //puede ser null
 

        // int = peso / lo mas pesado que haya levantado hasta la fecha...
        // eff = estimated1RM / el estimated mas pesado que haya levantado...
        days.forEach( day => {

            //
            // hay referente historico de best EFF & INT ? 
            //
            var [eff, int] = prs?.getBestEffInt( day.on ) || [null, null];

            //console.log("EFFINT de ", exercises[i].name," = ", eff, int )

            //
            // el método de arribba devuelve {w,r,s,when,...etc}
            //
            if( eff ) eff = eff.est1rm;
            if( int ) int = int.w;

            //
            // no hay. Calcular con los datos del día. ASí siempre va a haber eff o int.
            //
            if( !int || !eff )
            {
                //
                // solo calcular si no hay un referente histórico...
                //
                const calcEFF = !eff;
                const calcINT = !int;

                //
                // no hay histórico. Tomar los datos del día.
                //
                day.did.forEach( erow => {

                    // solo de este eid...
                    if( erow.e!=eid ) return; 

                    if( calcINT ) int = Math.max( int, erow.w );
                    if( calcEFF ) eff = Math.max( eff, erow.est1rm );

                });
            }  

            //
            // por
            //
            day.did
                .filter ( eblock=>eblock.eid==eid )
                .forEach( eblock => {
   
                    // setear EFF e INT
 
                    eblock.sets.filter( set=>set.type==0).forEach(set=>{

                        set.int = (int>0 ? Math.round( (set.w / int)*100 ) / 100 : 1);    //--- round a 2 solo decimal 

                        //
                        // si "eff"==0 significa que no hay eff. Ni siquiera erow.est1rm porque si ves mas arriba
                        // el eff tambien se calcula toando los erows... si eff es 0 todo es 0...
                        //
                        set.eff = (eff>0? Math.round( (set.est1rm / eff)*100 ) / 100 : 0);

                        //console.log("EFF: ", set.eff )

                    });
                    
            });

        }); 
        
    }
}


const __getReferencedExercises = async eids => {
    const exercisesFound = await query(`SELECT id, nombre FROM exercises WHERE id IN ?`, [ [eids] ]); 

    return exercisesFound.map(row => ({
        id: row.id,
        name: row.nombre,
        type: ename2type(row.nombre)
    })); 
}

const __getUserExercises = async uid => { 

    const exercisesFound = await query(`SELECT id, nombre FROM exercises WHERE uid = ?`, [ uid ]); 

    return exercisesFound.map(row => ({
        id: row.id,
        name: row.nombre,
        type: ename2type(row.nombre)
    })); 
}