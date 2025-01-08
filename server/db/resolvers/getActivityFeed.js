import { query } from "../connection.js";
import { dateASYMD } from "../../utils/dateASYMD.js";
import replaceAndExtractMedia from "../../utils/replace-and-extract-media.js";
import { ename2type } from "../../utils/ename2type.js";
import extractUserDataFromRow from "../../utils/extractUserDataFromRow.js";
import { AuthenticationError } from "apollo-server-express";
import { getAvatarHash } from "../../utils/get-avatar-hash.js";
import { addUtagsValuesToFeedUCards } from "./tags.js";


const totalJournals = async ( parent, args, context ) => {

    let result = await query("SELECT COUNT(id) as total FROM users"); 
    return result[0].total + 754; //la cantidad de usuarios de la base vieja que no pasaron a la nueva.
} 

 

const getActivityFeed = async ( parent, args, context ) => {  

    console.log("ARGS", args)

    const $LIMIT                    = 50;
    let setItemsLeftValue           = true;
    let TIME_CONSTRAIN_QUERY        = " ORDER BY A.last_log DESC";
    let TIME_CONSTRAIN_VALUE;

    //
    // en el caso de pedir "newer" los resultados van a venir invertidos...
    //
    let mustReSortResult        = false;

    const timeConstrainParams = [
        ["olderThan","<"] , ["newerThan",">",true]
    ]

    timeConstrainParams.some( ([prop, symbol, inReverseOrder])=>{
        if( args[prop] )
        {
            if( inReverseOrder )
            {
                TIME_CONSTRAIN_QUERY    = TIME_CONSTRAIN_QUERY.replace("DESC","ASC");
                mustReSortResult        = true;
                setItemsLeftValue         = false;
            }

            TIME_CONSTRAIN_QUERY = `AND A.last_log ${symbol} ? ${TIME_CONSTRAIN_QUERY}`;
            TIME_CONSTRAIN_VALUE = [ new Date(args[prop]) ]; 
 

            return true;
        }
    });

    // temp
    /*
    if( !TIME_CONSTRAIN_VALUE )
    {
        //"Sat, 07 Aug 2021 07:15:43 GMT"
        TIME_CONSTRAIN_QUERY = `AND A.last_log <= ? ${TIME_CONSTRAIN_QUERY}`;
        TIME_CONSTRAIN_VALUE = [ new Date( "Sat, 07 Aug 2021 07:15:43 GMT" ) ]; 
    }
    */



    const ORDER_BY  = `WHERE A.deleted=0 ${TIME_CONSTRAIN_QUERY}`;
    const fetch     = $extraSQL=>query(`SELECT 

                                    SQL_CALC_FOUND_ROWS 
                                    A.id, 
                                    A.uname, 
                                    A.private,
                                    A.isFemale, 
                                    A.joined,
                                    B.fecha_del_log AS ymd,
                                    A.usekg,
                                    A.country_code,
                                    A.supporterLevel,
                                    A.days_left_as_supporter  ,
                                    A.bday,
                                    A.bw,
                                    A.last_log,
                                    A.forumRole,
                                    B.log,
                                    B.id AS logid

                                FROM users AS A 
                                JOIN logs AS B ON B.id=A.idOfLastLog  
                                ${$extraSQL} ;
                                SELECT FOUND_ROWS() as itemsLeft
                                `, [TIME_CONSTRAIN_VALUE] 
                                ); 

    let result;

    switch( args.type )
    {
        case "global":
            result = await fetch( `${ORDER_BY} LIMIT ${$LIMIT}`); 
            break;

        case "following":
            if( context.session )
            {
                result = await fetch(`INNER JOIN follow AS C ON (C.followerid=${context.session.id} AND C.followingid=A.id) ${ORDER_BY} LIMIT ${$LIMIT}`);
                break;
            }  
            else 
            {
                throw new AuthenticationError("You are not logged in, i dont know who you are or who you follow...");
            }

        default:
            result = [];
    } 

    // ahora ver cuantos quedaron afuera...
    let itemsLeftResult = result[1];

    result              = result[0];
    
    //if( setItemsLeftValue )
    //{
        //itemsLeftResult = await query("SELECT FOUND_ROWS() as itemsLeft");
    //} 
    //console.log("LEFT", left[0].itemsLeft );


    if( mustReSortResult )
    {
        result.sort( (a,b)=>b.last_log-a.last_log );
    }

    
    let logid2preview   = {}; // { [logid] : [el array que tiene los preview sets] } 

    /** 
     * Limpiar el preview text...
     * Pero colecionar los EBLOCKS referenciados...
     * @param {String} txt 
     */
    const parsePreviewText = ( txt, lid, eblocksIDs, onMediaFound, onUtagValueIdFound ) => {

        let MAX_CHARS = 80;

        txt = txt.replace(/(UTAG|EBLOCK):(\d+)/g, (m,tokenType,id)=>{
 
                    const tokenID = parseInt( id );

                    switch( tokenType )
                    {
                        case 'EBLOCK': 
                            if( !logid2preview[lid] ) 
                                 logid2preview[lid] = eblocksIDs; 
        
                            logid2preview[lid].push( tokenID ) //no hace falta
                            return "";

                        case 'UTAG':
                            onUtagValueIdFound( tokenID );

                            return m; 
                    } 
                    

            }).replace(/\n+/g," | ").trim();

        //
        // extract media....
        //
        txt = replaceAndExtractMedia(txt, onMediaFound);

        let justLetters = txt.replace(/\s+|\|/g,"");
        if( justLetters.length == 0 )
            return null;  

        if( txt.length>80 )
        {
            //
            //avoid cutting UTAGs
            //
            const regex = new RegExp('\\bUTAG:\\d+\\b');
            const match = txt.substring(0, 80).match(regex);
            
            if ( match ) 
            {
                const newMax = match.index + match[0].length;

                MAX_CHARS = Math.max( MAX_CHARS, newMax ); 
            }  

            txt = txt.substring(0, MAX_CHARS) + '...';
        } 

        return txt;
    }
 
    // row.id = uid  row.logid 
 
    let ucards = result.map( row=>{
 
        
                    let eblocksIDs = [];
                    let media; //URL a una imagen onda thumbnail representativa del primer link a un video found en log text...
                    let utagValuesIDs = []; //<---- tags that the preview text of the log contains.
                    let user = extractUserDataFromRow(row);

                    if( row.private )
                    {
                        return {
                            user: {
                                id          : row.id
                                , avatarhash: getAvatarHash(row.id)
                                , uname     : row.uname 
                                , slvl      : row.supporterLevel
                                , sok       : Number(row.days_left_as_supporter>0) 
                                , private   : row.private
                                , isf       : -1
                                , joined    : row.joined.toUTCString()
                                , forumRole : user.forumRole
                            }
                            , when          : row.last_log //&& row.last_log.toUTCString()
                        }
                    }

                    return { 
                        user
                        , posted    : row.ymd && dateASYMD( row.ymd, true )
                        , when      : row.last_log && row.last_log.toUTCString() //Date.UTC(2021, 6, 15, 17, 0, 0),
                        , text      : row.log && parsePreviewText( row.log, row.logid, eblocksIDs, foundMedia=>media=foundMedia, tagid=>utagValuesIDs.push(tagid) )
                        , workoutPreview : eblocksIDs.length? eblocksIDs : null
                        , media
                        , utags     : utagValuesIDs.length? {
                            tags    : [],
                            values  : utagValuesIDs
                        } : null

    }}); 

    let logids = Object.keys(logid2preview).map(id=>Number(id));

    if( logids.length )
    { 
        // buscar los erows...
        let erows = await query(   `SELECT A.logid, A.eid, C.nombre AS ename, A.wkg, A.inlbs, A.reps 
        
                                    FROM erows AS A 

                                    INNER JOIN exercises AS C ON A.eid=C.id
        
                                    INNER JOIN ( SELECT logid, block, eid, MAX(wkg) AS top FROM erows where logid IN (?) GROUP BY logid, eid, block ) AS B 
                                    
                                    ON A.wkg=B.top AND A.logid=B.logid AND A.block=B.block AND A.eid=B.eid

                                    ORDER BY A.id ASC
        
                                `, [logids]); 

        // agregar los previews... 
        erows.forEach( erow => {  

            let index = logid2preview[ erow.logid ].findIndex( v=> !isNaN(v) && v==erow.eid ); //agregarlo en el placeholder...
            if( index>-1 )
            {
                logid2preview[ erow.logid ][index] = {
                     e : { id: Number(erow.eid) , name: erow.ename, type:ename2type(erow.ename) } 
                    , w: erow.wkg 
                    , r: erow.reps 
                };
            }

        }); 


        //
        // capear el log preview a solo 3 items
        //
        ucards.forEach( ucard=>{

            if( ucard.workoutPreview )
            {
                let totalBlocks     = ucard.workoutPreview.length;
                const MAX_BLOCKS    = 3;
 
                // ordenar de mas pesado a mas lviano
                ucard.workoutPreview = ucard.workoutPreview 
                                                            //
                                                            // si el log hace referencia a un ejercicio borrado, en "workoutPreview" ese ejercicio
                                                            // va a aparecer como un numero (el id del ejercicio borrado) asi que ignorarlo.
                                                            //
                                                            .filter( itm=>isNaN(itm) )

                                                            .sort( (a,b)=>b.w-a.w ) 
                                                            .filter( (x,i,a)=>a.findIndex( itm=>itm.e.id==x.e.id )==i ); //unique EIDs
                 

                if( ucard.workoutPreview.length>MAX_BLOCKS )
                {
                    let eliminados = totalBlocks - MAX_BLOCKS; 
                    ucard.workoutPreview.length = MAX_BLOCKS;
                    ucard.andXmore = eliminados;
                } 
            }

        });

    }


    //
    // add User tags data data...
    //
    await addUtagsValuesToFeedUCards( ucards );


    //
    // 
    //
    if( setItemsLeftValue && ucards.length )
    {
        //console.log("Items left result",itemsLeftResult[0].itemsLeft );
        ucards.slice(-1)[0].itemsLeftAfterThis = Math.max(0, itemsLeftResult[0].itemsLeft-ucards.length ) ;//Math.max(0, itemsLeftResult[0].itemsLeft - ucards.length);
    }

    return ucards;
}


export const ActivityFeedResolvers = {
    Query: {
        getActivityFeed
        , totalJournals
    }
}