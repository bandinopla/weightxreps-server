import { query, transaction } from "../connection.js";
import { dateASYMD } from "../../utils/dateASYMD.js";
import { getAvatarHash } from "../../utils/get-avatar-hash.js"; 


/**
 * 
 * 
 * 
 * 
 */

const LIMIT                 = 10; //cuantas notificaciones devolver por call...
const SHORT_TEXT_MAX_CHARS  = 80;


const __UnionResolver = {
    __resolveType(obj, context, info){
        return obj._type;
    }
}
 

const _globalSubjectAndText2Message = (subject, text)=>subject + "\n"+ "-".repeat(subject.length)+"\n" + text;


export const InboxResolvers = { 

    Notification        : __UnionResolver, 
    SendMessageResult   : __UnionResolver,

    Query: {
  

        getDate: (_,args,context, info)=>{

            info.cacheControl.setCacheHint({ maxAge: 5, scope: 'PUBLIC' });
            return new Date();
        },

        getAnnouncements: async ( _,args,context )=>{

            const limit         = args.limit || 3;
            const olderThan     = args.olderThan || new Date(); //toUTCString

            const msgs = await query(`SELECT * FROM messages WHERE isGlobal=1 AND fecha<? ORDER BY id DESC LIMIT ${limit}`, [ olderThan ]);

            return msgs.map( msg=> ({
                type:"info",
                __typename:"SystemNotification",
                id: msg.id, 
                when: msg.fecha,
                //text:msg.subject + "\n"+ "-".repeat(msg.subject.length)+"\n" + msg.message
                text: _globalSubjectAndText2Message( msg.subject, msg.message )
            }) );

        },


        getNotifications: async (_, args, context) => {
 
            // only comments on logs, likes and notifications...
            //
            return await _getNotifications({  

                $onlyThisLOG    : -1, // All logs
                $onlyTo         : context.session.id,  

                partialMessages : true, //traer textos parciales...

                olderThan       : args.olderThan,
                newerThan       : args.newerThan,
            }); 
        },


        /**
         * @typedef {object} GetInboxParams
         * @property {number} dmsWithUID -modo DM. Solo mensajes y likes a mensajes con este uid.
         * 
         * -- las chances de que dos cosas tengan la misma fecha hasta los segundos es tan baja que es ignorable, por eso, hacer el pagintation
         * tomando una fecha como anchor esta bien. --
         * 
         * @property {Date} olderThan -Notificaciones mas viejas que esta fecha.  
         * @property {Date} newerThan -Notificaciones mas nuevas que esta fecha.  
         * ---
         * 
         *  
         * @param {GetInboxParams} args 
         * @param {{ session:{ id:number, uname:string } }} context 
         * @returns 
         */
        getInbox: async ( parent, args, context, info ) => {  

            //
            // DM Mode, we are inside of a "chat" window
            //
            if( args.dmsWithUID )
            {
                //normal get all notifications 
                // Only messages directed to the user.
                
                return await _getNotifications({  
                    $onlyThisLOG    : 0,  //<-- exclude comments on logs. Only show DMs.
                    $onlyTo         : context.session.id,
                    $onlyFrom       : args.dmsWithUID, 
                    $includeSent    : true, 
                    olderThan       : args.olderThan,
                    newerThan       : args.newerThan, 
                    partialMessages : false  
                });
            }

            //
            // General overview Mode... get "1 item" per "chat" ( mesage or like to a comment )
            //
            else 
            {
                const UID = context.session.id;

                //
                // get active chats mode
                //
                const $sqlMessages = `SELECT
                                        CASE WHEN A.touid < B.uid THEN CONCAT(A.touid,':', B.uid) ELSE CONCAT(B.uid,':', A.touid) END AS chatkey, 

                                        MAX(B.fecha) AS mostRecentFecha,
                                        MAX(B.id) AS mostRecentMsgId 
                                        
                                        FROM message_to AS A 
                                        
                                        INNER JOIN messages AS B ON B.id=A.msgid 

                                        WHERE 

                                            ( A.touid=${UID}  OR  B.uid=${UID} ) 
                                             
                                            AND B.logid=0 

                                            ${ 
                                            
                                                //
                                                // for admin, remove automatic messages to avoid saturating the inbox.
                                                //
                                            UID==1?` 
                                                
                                                AND (B.isGlobal=0 OR A.touid=1)
                                                AND B.message NOT LIKE 'Happy Anniversary%'
                                                AND B.message NOT LIKE 'Happy Birthday%'
                                                AND B.message NOT LIKE 'Welcome to the site!%'
                                                AND B.message NOT LIKE '%hope you enjoy and find this app useful%'
                                            ` : "" }

                                            ${ args.olderThan? ` AND B.fecha < ?` :
                                            args.newerThan? ` AND B.fecha > ?` : "" } 

                                        GROUP BY chatkey

                                        ORDER BY mostRecentMsgId DESC #<--- results in most recent to oldest messages.
                                        
                                        LIMIT ${LIMIT}`;

                let chats = await query( $sqlMessages, [ args.olderThan ?? args.newerThan ] );
   
                let likes   = [];

                if( chats.length )
                {
                     
                    
                    //
                    // get latest likes in those chat ids...
                    // Obtain likes that have occured inside on of those "chat" interactions.
                    //
                    const $sqlLikes = `SELECT  
                                            CASE WHEN A.uid < B.uid THEN CONCAT(A.uid,':', B.uid) ELSE CONCAT(B.uid,':', A.uid) END AS chatkey,
                                            MAX(A.fecha) AS mostRecentFecha,
                                            MAX(A.id) AS mostRecentLikeId

                                        FROM likes_history AS A 

                                        #
                                        # Inner join with DMs only. (to exlcude likes to journal comments)
                                        #
                                        INNER JOIN messages AS B ON B.id=A.source_id AND A.type_id=3 AND B.logid=0 

                                        WHERE 

                                            ${ 
                                            //
                                            // Only likes in one of the "chats" queried by $sqlMessages
                                            //    
                                            chats.map( chat=>{

                                                const [ uidA, uidB ] = chat.chatkey.split(":");

                                                return `(( A.uid=${uidA} AND B.uid=${uidB} ) 
                                                        OR ( A.uid=${uidB} AND B.uid=${uidA} ))`

                                            }).join(" OR ") }  

                                        GROUP BY chatkey
                                        ORDER BY A.id DESC #<--- results in newer first
                                    `;


                    likes = await query( $sqlLikes ); 
 

                    return await _getNotifications({  

                        $globalsOnlySentTo  : UID, //<--- to avoid spamming the UID:1 a.k.a. admin...
                        $onlyTheseMessages  : chats.map(chat=>chat.mostRecentMsgId),
                        $onlyTheseLikes     : likes.map( like=>like.mostRecentLikeId), 
                        partialMessages     : true //traer textos parciales...

                    });
                }  
                

            }
 
            
        },

        /** 
         * devuelve el "inbox" de un journal log...
         * 
         * @param {{ logid:number, olderThan:Date, newerThan:Date }} args -El id del log...
         */ 
        getLogInbox: async ( parent, args, context ) => {

            // TODO habria que chequear que no se esté queriendo acceder a un private log... 
            return await _getNotifications({ 
                $onlyThisLOG    : args.logid,  
                olderThan       : args.olderThan,
                newerThan       : args.newerThan,
                noLimit         : true
            });
        },


        /** 
         * @param {{ olderThan:Date, newerThan:Date }} args   
         */
        getAllPublicInteractionsInbox: async ( parent, args, context, info )=> {
  
            return await _getNotifications({   
                olderThan       : args.olderThan,
                newerThan       : args.newerThan 
            });
        }
    },

    Mutation: {

        /** 
         * @param {any} _ 
         * @param { { message:string, type:string, target:string }} args 
         * @param {{ session:{ id:string, uname:string }}} context 
         * 
         * que devuelve?...
         *  Devuelve la única data que el front-end no conoce. Todo lo demás se puede saber desde el front-end. (logid, parentid, ymd, etc...)
         */
        sendMessage: async (_, args, context )=> {

            let myID                = context.session.id;  

            //
            // ver qué hacer según el tipo... devolver un objeto notification....
            //
            switch( args.type )
            {
                //#region Send DM...
                case "DM":   

                    return await postComment({
                        by          : myID,
                        touid       : args.target, // target es un user ID
                        message     : args.message
                    });  
                //#endregion

                //#region  Replying...
                case "REPLY":  
                    //
                    // obtener el mensaje al cual estamos respondiendo...
                    //
                    var targetRow = await query(`
                        SELECT  A.id AS parentid, 
                                A.logid, 
                                A.uid AS touid,
                                B.uid AS jowner,  
                                C.uname AS jownerUname,
                                B.fecha_del_log AS ymd 
                                
                        
                                FROM messages AS A 
                                LEFT JOIN logs AS B ON B.id=A.logid 
                                LEFT JOIN users AS C ON C.id=B.uid
                                
                                WHERE A.id=?`
                        
                        , args.target); // target es un messages.id

                    if( !targetRow.length )
                    {
                        throw new Error("Can't find the message you are trying to reply to...");
                    }

                    var row       = targetRow[0];  

                    return await postComment({
                        ...row,
                        by          : myID,
                        message     : args.message
                    }) ; 
                //#endregion

                //#region Journal Comment...
                case "JCOMMENT": // obtener log info...

                    //
                    // obtener indo del journal en el cual estamos comentando
                    //
                    var jrow = await query(`
                        SELECT  A.id AS touid, 
                                B.uid AS jowner,
                                A.uname AS jownerUname, 
                                B.fecha_del_log AS ymd, 
                                B.id AS logid  

                                FROM logs AS B 
                                INNER JOIN users AS A ON A.id=B.uid 
                                WHERE B.id=?`
                        
                        , args.target); //:: target es un log.id

                    if( !jrow.length )
                    {
                        throw new Error("Can't find the journal's log you are trying to comment on...");
                    }

                    var row             = jrow[0];

                    return await postComment({
                        ...row,
                        by          : myID,
                        message     : args.message
                    }) ;
                     
                //#endregion

                //#region GLOBAL MESSAGE
                case "GLOBAL": 

                    if( myID!=1 )
                    {
                        throw new Error("Only admins can send global messages!");
                    }

                    const everyone  = await query(`SELECT id FROM users WHERE deleted=0`);
                    const allUIDs       = everyone.map(row=>row.id);
                    const msgLines = args.message.split("\n");

                    if( msgLines.length<2 )
                    {
                        //throw new Error("Un global debe tener al menos 2 líneas. La primera es el título, las demás son el mensaje...")
                        throw new Error("A GLOBAL message must have at least 2 lines. The first will be the title, the rest will be the body of the message.");
                    }

                    return await _insertMessage( allUIDs , { 
                        uid         : myID,
                        subject     : msgLines.shift(), // first line...
                        message     : msgLines.join("\n").trim(), 
                        logid       : 0 , 
                        parentid    : 0 ,
                        isGlobal    : 1
                    });     

                //#endregion

                default:
                    throw new Error("Unknown comment type...");
            }
 
            
        },

        /**
         * Borrar mensaje...
         * @param {any} _ 
         * @param {{ id:Number }} args 
         * @param {{ session:{ id:string, uname:string }}} context 
         */
        deleteMessage: async(_,args, context)=>{
            const msgid             = args.id;
            let myID                = context.session.id;  

            var results             = await query("UPDATE messages SET message='' WHERE id=? AND uid=?", [msgid, myID ]);

            return results.changedRows>0;
        }
    }
}


 
/**
 * @typedef {object} _getNotificationsParams 
 * 
 * @property {number[]|null} $onlyTheseMessages - pre selected message ids
 * @property {number[]|null} $onlyTheseLikes - pre selected likes ids
 * @property {number|null} $globalsOnlySentTo - only globals sent directly to this uid
 * @property {number} $onlyThisLOG - 1+ = Only comments in this log. 0 = Direct Messages only. -1 = All comments on logs but no DMs.
 * @property {number} $onlyTo -solo enviados a ese usuario
 * @property {boolean} $includeSent -incluir tambien mensajes enviados por $onlyTo  
 * @property {Date} olderThan -devolver cosas older than esta fecha
 * @property {Date} newerThan -devolver cosas newer than esta fecha
 * 
 * @param {_getNotificationsParams} param0 
 * @returns 
 */
 const _getNotifications = async ({

    $onlyTheseMessages,
    $onlyTheseLikes,
    $globalsOnlySentTo,
 
    $onlyThisLOG    ,
    $onlyTo         ,  
    $onlyFrom       ,  
    $includeSent    , 
    olderThan       ,
    newerThan       ,
    partialMessages = false,
    noLimit         = false,
}) =>{   
               
    const DM_MODE               = $onlyFrom!=null && $onlyTo!=null;  
    const IGNORE_SENT_TO_SELF   = !DM_MODE && $onlyThisLOG<0;

    const BY            = new UserFieldsManager("D","by_");
    const TO            = new UserFieldsManager("E","to_"); 
    const JOWNER        = new UserFieldsManager("F","jowner_"); 

    let extraWHERE      = "";
    let queryParams     = [];
    let reverse         = false; 
    var queryDateLimit  ;
     

    //#region date range selection
    if( olderThan ) 
    {
        extraWHERE = " AND (B.fecha < ? )"; 

        //
        // porque se usa 2 veces...
        //
        queryParams         = new Array(2).fill(olderThan);
        queryDateLimit      = olderThan;
    }
    else if( newerThan ) 
    {
        extraWHERE = " AND (B.fecha > ? )";  
        reverse = true;

        //
        // porque se usa 2 veces...
        //
        queryParams         = new Array(2).fill(newerThan); 
        queryDateLimit      = newerThan;
    }
    //#endregion


    //
    // selecciona mensajes...
    //
    let $sql = `    SELECT * FROM (
                    # ----------------------------------------------------------------------------------------------------------------------------------------
                    #   :::    MENSAJES    :::
                    #
                    SELECT    A.id AS notificationID, 
                                A.touid,  
                                B.*, 
                                logs.fecha_del_log AS ymd,
                                Z.uid as parentuid,
                                
                                ${ BY.userFieldsQuery() },
                                ${ TO.userFieldsQuery() },
                                ${ JOWNER.userFieldsQuery() }


                            FROM message_to AS A 
                            INNER JOIN messages AS B    ON B.id=A.msgid 
                            LEFT JOIN logs              ON logs.id=B.logid 
                            LEFT JOIN messages AS Z     ON Z.id=B.parentid

                            ${ BY.innerJoinOnIdEquals("B.uid") }
                            ${ TO.innerJoinOnIdEquals("A.touid") }
                            ${ JOWNER.leftJoinOnIdEquals("logs.uid") }

                            WHERE  
                            
                                ${ $globalsOnlySentTo? `(B.isGlobal=0 OR A.touid=${$globalsOnlySentTo}) AND ` :"" }

                                ${ $onlyTheseMessages? `B.id IN (?)` 

                                    : 

                                    `
                                        
                                    #
                                    # FROM / TO filter...
                                    #
                                    (
                                        (
                                            ${$onlyTo? `A.touid=${$onlyTo}`:"1"} 

                                            ${$onlyFrom? ` ${$onlyTo?" AND " : ""} B.uid=${$onlyFrom}`:" AND 1"}
                                        )

                                        OR

                                        ${ $includeSent? `( B.uid=${ $onlyTo  + ($onlyFrom? " AND A.touid="+$onlyFrom :"") } )` : "0" }
                                    )

                                    ${IGNORE_SENT_TO_SELF?" AND A.touid!=B.uid":""}
    
                                    #
                                    # LOGID filter
                                    #
                                    ${ $onlyThisLOG!=null? $onlyThisLOG<0? " AND B.logid > 0 " : " AND B.logid="+$onlyThisLOG :"" } # Only this log... 


                                    ${extraWHERE} AND 123  #<<--- later in the code i search for this "123"


                                    ORDER BY B.fecha ${reverse?"ASC":"DESC"} 

                                
                                    ${noLimit? "":`LIMIT ${LIMIT}`}` 

                                /* endif:$onlyTheseMessages */} 

                        ) AS AB
                        #  
                        # newest to oldest...
                        #
                        ORDER BY AB.fecha DESC`;  

    const JOURNAL_LIKE_TYPE = 1;
    const LIKE_TO_MESSAGE_TYPE = 3; 
    const $touid = `IF( A.type_id=${JOURNAL_LIKE_TYPE}, C.uid, B.uid )`; //<--- to whom the like was given.
    let likesSQL = `
                    SELECT * FROM (
                    # ----------------------------------------------------------------------------------------------------------------------------------------
                    # LIKES...
                    # 
                    SELECT      A.id AS notificationID, 
                                ${$touid} AS touid,      
                                0 AS id, 
                                0 AS topic, 
                                0 AS isGlobal, 
                                A.uid, 
                                IF( A.type_id=${JOURNAL_LIKE_TYPE}, "like-on-log", "like-on-comment") AS subject,  
                                B.message , #<---- can be null if it was a like on a journal
                                A.fecha, 
                                IF( A.type_id=${JOURNAL_LIKE_TYPE}, 0, A.source_id )       AS parentid,  
                                C.id AS logid, 
                                C.fecha_del_log AS ymd,
                                0 as parentuid,

                                ${ BY.userFieldsQuery() },
                                ${ TO.userFieldsQuery() },
                                ${ JOWNER.userFieldsQuery() } 
                                
                            
                        FROM likes_history AS A 

                        #
                        # like on a comment / message
                        #
                        LEFT JOIN messages AS B   ON A.type_id=${LIKE_TO_MESSAGE_TYPE}  AND B.id=A.source_id  

                        #
                        # like on a journal log.
                        #
                        LEFT JOIN logs AS C       ON C.id=IF( A.type_id=${JOURNAL_LIKE_TYPE}, A.source_id, IF( A.type_id=${LIKE_TO_MESSAGE_TYPE}, B.logid, 0 ) )


                        ${ BY.innerJoinOnIdEquals("A.uid") }
                        ${ TO.innerJoinOnIdEquals(`IF( A.type_id=${JOURNAL_LIKE_TYPE}, C.uid, B.uid )`) }
                        ${ JOWNER.leftJoinOnIdEquals("C.uid") }

 
                        WHERE 

                            ${ $onlyTheseLikes? `A.id IN (?)` 
                                : 
                                `   #
                                    #  solo likes en journal o comments.
                                    #
                                    (A.type_id=${JOURNAL_LIKE_TYPE} OR A.type_id=${LIKE_TO_MESSAGE_TYPE})  
        
        
                                    AND
        
                                    #
                                    # FROM / TO filter...
                                    #
                                    (
                                        (
                                            ${$onlyTo? `${$touid} =${$onlyTo} `:"1"} 
        
                                            ${$onlyFrom? ` ${$onlyTo?" AND " : ""} A.uid=${$onlyFrom}`:" AND 1"}
                                        )
        
                                        OR
        
                                        ${ $includeSent? ` ( A.uid=${$onlyTo + ($onlyFrom?" AND "+ $touid+"="+$onlyFrom:"") } )` : "0" }
                                    )
        
                                    #
                                    # LOGID filter
                                    #
                                    ${ $onlyThisLOG<0? " AND C.id>0 " : $onlyThisLOG>0? " AND C.id="+$onlyThisLOG :" AND C.id IS NULL" } 
        
        
                                    #
                                    # Fecha filter...
                                    #
                                    ${extraWHERE.replace("B.fecha","A.fecha")} 
                                    
                                    
                                    ORDER BY A.fecha ${reverse?"ASC":"DESC"} 
        
                                    ${noLimit? "":`LIMIT ${LIMIT}`}
                                ` 
                                /* endif: $onlyTheseLikes */}

                            ) AS AB

                            #  
                            # newest to oldest....
                            #
                            ORDER BY AB.fecha DESC 
                            `; 
 

    //
    // get notifications...
    //
    let rows = $onlyTheseMessages? 
                    $onlyTheseMessages.length? 
                        await query($sql,[$onlyTheseMessages]) : []
               : await query( $sql, queryParams );  



    //
    // likes...
    //
    let likesRows = $onlyTheseLikes?
                        $onlyTheseLikes.length? 
                            await query(likesSQL,[$onlyTheseLikes]) : []  
                    : await query( likesSQL, queryParams );      


    const rowsHasLIMIT = !$onlyTheseMessages && !noLimit && rows.length==LIMIT;
 


    // 
    // CAP / Cut overflow rsultset...
    //
    if( rowsHasLIMIT && likesRows.length>0 )
    {     
        const newestRow     = rows[0].fecha;
        const oldestRow     = rows[ rows.length-1 ].fecha;

        //
        // we have newer likes, but "rows" probably too, but was limited by LIMIT.
        //
        if( newerThan )
        { 
            likesRows       = likesRows.filter( row=>row.fecha<=newestRow );
        }
        else 
        { 
            likesRows       = likesRows.filter( row=>row.fecha>=oldestRow );
        } 
 
    }  
    

    //
    // add likes info...
    //
    rows = [...rows, ...likesRows].sort((a, b) => b.fecha - a.fecha);  
 
 

    //
    // convert to graphql format
    //
    return await getInboxGraphQLResponse( rows, BY, TO, JOWNER, partialMessages, DM_MODE );   
} 



/**
 * Convierte el resultado de mysql al que requiere el graphql schema
 */
const getInboxGraphQLResponse = async ( rows, BY, TO, JOWNER, partialMessages=false, DM_MODE=false ) => {

            /**
             * jowners referenciados
             */ 
             let users           = []; 
             let notifications   = []; 

             /** 
              * 
              * para el caso donde solo tengamos disponible el UNAME de un usuario y necesitemos obtener el objeto entero...
              * 
              * @type { { uname:string, target:object, targetProp:string}[] }
              */ 
             let resolveTheseUsernames = []; 
 
             /**
              * Agrega el objeto user en el array "users" si no existe.
              * devuelve el "id" de dicho usuario.
              * @return {number} devuelve `user.id`
              */
             const userRef = user => { 
                 
                if( !user?.id ) return;

                 if( users.findIndex(u=>u.id==user.id) < 0 ) {
                     users.push( user );
                 } 
                 return user.id; // puede ser null
             }

             /**
              * Acortamos el texto para no mandar un choclo de texto al client
              * @param {string} txt
              */
             const shortText = txt => { 
                txt = unescape(txt).trim();
                return  txt.length>=SHORT_TEXT_MAX_CHARS? txt.substr(0,SHORT_TEXT_MAX_CHARS): txt;
             }


             //==================================== devolver Inbox graphql object. See InboxTypes.js ===================================
 
             //#region convertir rows de mysql al formato de GraphQL
             rows
             

             //
             // quitar "broken" items...
             //
             .filter( row=>{
                //
                // en la version vieja se ve que al borrar un log los mensajes quedaban huerfanos.
                // Si el mensaje hace referencia a un logid que no existe, ignorarlo...
                //
                if( row.logid>0 && !row.ymd ) //<--- "ymd" se obtiene vía LEFT JOIN, por eso puede que sea null.
                { 
                    return false;
                }

                return true;
             })
             
             //
             // por cada item...
             //
             .forEach( row=>{
 
                 let id         = row.notificationID;

                 //
                 // ignorar referencias a usuarios borrados.
                 //
                try{
                    var by         = BY.extractUserData(row);
                    var to         = TO.extractUserData(row);
                    var jowner     = JOWNER.extractUserData(row); 
                }
                catch( e )
                { 
                    if( e instanceof ReferencingDeletedUser )
                    {
                        //console.log( e );
                        return; //ignore ?
                    } 
                    else 
                    {
                        console.log( row )
                        throw e; 
                    }
                }  


 
                /**
                 * ***************************** EL ORDEN DE ESTOS IF IMPORTA!!! ******************************************************
                 */

                //#region LikeOnMyComment & LikeOnMyDM
                if( row.subject=="like-on-comment")
                { 
                    notifications.push( {
                        _type       : row.logid>0? "LikeOnJComment" : "LikeOnDM", 
                        by          : userRef(by),
                        to          : userRef(to),
                        when        : row.fecha ,
                        id ,

                        ymd         : row.ymd ? dateASYMD( row.ymd, true ) : null,  
                        jowner      : userRef(jowner), //peude ser null

                        text        : shortText( row.message ) , //-->texto del mensaje al que le hicimos like...
                        msgid       : row.parentid //id del message likeado
                    });  

                }
                //#endregion
                
                //#region LikeOnLog
                else if( row.subject=='like-on-log')
                {  
                    notifications.push( {
                        _type       : "LikeOnLog", 
                        when        : row.fecha ,
                        id , 
                        by          : userRef(by),
                        jowner      : userRef(jowner), 
                        ymd         : dateASYMD( row.ymd, true ),
                    } );  
                }
                //#endregion
 
                //#region SystemNotification
                else if( row.isGlobal )
                { 

                    // if( DM_MODE )
                    // {

                        //
                        // Globals will appear as if sent by whomever created the global in this case UID:1 the admin...
                        //
                        notifications.push({
                            _type           : "DM",
                            id,
                            when            : row.fecha,
                            by              : userRef( by ),
                            to              : userRef( to ),
                            text            : partialMessages? shortText(row.message) : unescape( row.message ),
                            msgid           : row.id,
                            inResponseToMsg : null,
                            inResponseTo    : null,  

                            ymd             : null,
                            jowner          : null, 
                            isGlobal        : true
                        });   
                    // }
                    // else 
                    // {
                    //     notifications.push({ 
                    //         _type       : "SystemNotification",
                    //         id          : row.id  , // row.id = message.id
                    //         type        : "info",
                    //         //text        : row.message ,
                    //         text: _globalSubjectAndText2Message( row.subject, row.message ),
                    //         when        : row.fecha
                    //     });
                    // }
                    
                }
                //#endregion
 
                 else if( !by.id ) //----> los eventos tienen uid=0
                 { 
                    var m ;  

                    //#region ignorando old-version "thumbs up" notification message
                    if( m = row.message.match(/journal\/(\w+).*gave you thumbs up.*(\d{4}-\d{2}-\d{2})/) ) 
                    {  
                        // let _username   = m[1];
                        // let notif       = {
                        //     _type       : "LikeOnLog", 
                        //     when        : row.fecha ,
                        //     id,
                        //     ymd         : m[2],

                        //     // ver si ya tenemos la referencia...
                        //     by          : users.find(u=>u.uname==_username)?.id
                        // } 

                        // notifications.push( notif ); 

                        // if( !notif.by )
                        // { 
                        //     resolveTheseUsernames.push( {
                        //         uname       : _username,
                        //         target      : notif,
                        //         targetProp  : "by"
                        //     } );  
                        // } 
                    } 
                    //#endregion

                    //#region StartedFollowingYou
                    else if( m = row.message.match(/(?:strong>|journal\/)(\w+).*is now following you/) ) 
                    { 
                        let _username   = m[1];
                        let notif       = {
                            _type       : "StartedFollowing", 
                            when        : row.fecha ,
                            id,

                            // ver si ya tenemos la referencia...
                            by          : users.find(u=>u.uname==_username)?.id,
                            to          : userRef( to )
                        } 

                        notifications.push( notif );  

                        if( !notif.by )
                        { 
                            resolveTheseUsernames.push( {
                                uname       : _username,
                                target      : notif,
                                targetProp  : "by"
                            });
                        } 
                    }
                    //#endregion
 
                 }
 
 
                 //#region DM or JComment
                 else 
                 {       
                        notifications.push({
                            _type           : row.logid>0? "JComment" : "DM",
                            id,
                            when            : row.fecha,
                            by              : userRef( by ),
                            to              : userRef( to ),
                            text            : partialMessages? shortText(row.message) : unescape( row.message ),
                            msgid           : row.id,
                            inResponseToMsg : row.parentid || null,
                            inResponseTo    : row.parentuid || null,  

                            ymd             : row.logid>0? dateASYMD(row.ymd,true) : null,
                            jowner          : userRef( jowner ),
                        });   
                     
                 }
                 //#endregion
 
             });
             //#endregion
             
 
             //#region necesitamos resolver usernames to User?
             if( resolveTheseUsernames.length )
             { 
                let urows       = await query(`SELECT * FROM users WHERE uname IN (?)`, [ resolveTheseUsernames.map(r=>r.uname) ]);
                let USR         = new UserFieldsManager("","");
                let foundUsers  = urows.map(row=>USR.extractUserData(row));


                // los podemos agregar de una, porque ya hice el chequeo previo para solo agregarle al "resolveTheseUsernames" uname que no
                // existan en users.
                users = [
                    ...users, 
                    ...foundUsers
                ];

                //
                // ok, resolver los pedidos de info por uname...
                //
                resolveTheseUsernames.forEach( 

                    r => {
                        let found = foundUsers.find( u=>u.uname==r.uname );

                        if( found )
                            r.target[r.targetProp] = found.id;
                        else 
                            notifications = notifications.filter( notif=>notif!=r.target ); //borrar esta notificacion por hacer referencia a un usuario que no existe.
                    }
                
                ); 
             }
             //#endregion
 
 
 
             return {
                 referencedUsers: users,
                 notifications
             }
}



/**
 * Utility class para poder administrar mas facil la conversion entre mysql fields y graphql fields
 * para un usuario
 */
export class UserFieldsManager {

    static objFields() { return ["id","uname", "joined", "slvl"          ,"sok"                    ,"private","isf", "cc" ]; }
    static sqlFields() { return ["id","uname", "joined", "supporterLevel","days_left_as_supporter" ,"private","isFemale","country_code","deleted"]; }

    /** 
     * @param {string} table Alias de la tabla que contiene los campos del usuario en un mysql resultset
     * @param {string} prefix refijo para agregarle a los campos de la tabla en el resultset
     */
    constructor( table, prefix )
    {
        this.table  = table;
        this.prefix = prefix;
    }

    __joinSWQL( type, what ) {
        return `${type} JOIN users AS ${this.table} ON ${this.table}.id=${what}`;
    }

    leftJoinOnIdEquals( what ) {
        return this.__joinSWQL("LEFT", what);
    }

    innerJoinOnIdEquals(what) {
        //return `INNER JOIN users AS ${this.table} ON ${this.table}.id=${what}`;
        return this.__joinSWQL("INNER", what);
    }

    /** 
     * @returns {string} Devuelve la seleccion de campos para poner en un SELECT query
     */
    userFieldsQuery() {
        return UserFieldsManager.sqlFields()
                .map( field=>this.table+"."+field+" AS "+ this.prefix+field )
                .join(", ");
    }

    /** 
     * @param {any} row  un SQL resultset que contiene los campos devueltos por "userFieldsQuery"
     * {@link UserFieldsManager~userFieldsQuery}
     */
    extractUserData( row ) {

        let outFields = UserFieldsManager.objFields();

        if( row[this.prefix+"deleted"] )
        {
            throw new ReferencingDeletedUser( row[this.prefix+"uname"] );
        }

        var usr = UserFieldsManager.sqlFields().reduce( (host, current, i)=>{
 
            host[ outFields[i] ] = row[this.prefix+current];
            return host;

        } ,{} );

        // hash del avatar...
        usr.avatarhash = getAvatarHash(usr.id);

        usr.joined = new Date(usr.joined).toISOString();

        //console.log( "usr.avatarhash",usr.avatarhash)

        return usr;

    }
} 

class ReferencingDeletedUser extends Error { 
    /** 
     * @param {string} uname 
     */
    constructor(uname) {
        super("Referencing deleted user: "+uname);
    }
}
 

/** 
 * @param {number|number[]} to -el ID o IDs de a quienes enviar este mensaje... 
 * @param {{ topic:number, isGlobal:number, uid:number, subject:string, message:string, fecha:Date, parentid:number, logid:number }} msgFields -campos del message
 * 
 * @returns 
 */
const _insertMessage = async ( to, msgFields ) =>
{
    const op = await transaction(); 

    const params = {   
            topic: 0,
            isGlobal: 0,
            uid: 0,
            subject:"",
            message:"",
            fecha: new Date(),
            parentid: 0,
            logid: 0,

            ...msgFields 
    };

    // crear mensaje 
    const insert1 = await op.query("INSERT INTO messages SET ?", params);

    const msgid = insert1.insertId;
 

    const insert2 = await op.query("INSERT INTO message_to (msgid, touid, leido) VALUES ?", 

                        [ 
                            (Array.isArray(to)? to : [to])
                                .map( to=>([
                                    msgid ,
                                    to,
                                    0 
                                ]))
                        ]
                    ); 
 
    const mainNotificationID = insert2.insertId; //--> el id en message_to del primer insert.

    await op.commit();

    return { 
        msgid,
        id             : mainNotificationID,
        when           : params.fecha
    };
}

export const insertMessage = _insertMessage;

export const sendWelcomeMessage = async to => {
    //Welcome to weightreps.net !
    //Welcome to the site! if you have any questions, just let me know.
    return await _insertMessage( to, {
        uid: 1,
        subject: "Welcome to weightxreps.net !",
        message: "Welcome to the site! if you have any questions, just let me know."
    })
}

async function getUsersByUname (unames) {
    return await query(`
                        #
                        # referenced users...
                        #
                        SELECT id, uname, "ref" AS type FROM users WHERE uname IN (?)`, [unames] );
}



/** 
 * @typedef {object} postCommentParams
 * @property {number} logid ID del log en el que aparece el mensaje
 * @property {number} parentid ID del mensaje al cual le está respondiendo este comment
 * @property {number} jowner ID del journal owner
 * @property {string} jownerUname Username del journal owner
 * @property {string} ymd fecha del log...
 * @property {string} message el mensaje
 * @property {number} touid ID del usuario main target
 * @property {number} by ID de quien envía el mensaje
 * 
 * @param {postCommentParams} o 
 */
async function postComment( o )
{ 
    const isDM  = !o.logid;   
    var tos     = [o.touid];

    const jcommentSubject   = (uname, ymd)=>`Comment on ${uname}'s ${dateASYMD(ymd)}`;

    //
    // si no es un DM le damos bola a las menciones...
    //
    if( !isDM )
    {
        //#region extract mentions

        //extraer usernames de message "@"  :  select id, uname  from users where uname IN (...)
        //si hay logid, obtener el jowner   :  select B.id, B.uname from logs AS A INNER JOIN users AS B ON B.id=A.uid WHERE A.id=logid 
        //si hay parentid obtener el uid    : select B.id, B.uname from messages AS A INNER JOIN users AS B ON B.id=A.uid WHERE A.id=parentid
        let referencedUnames = [];

        //
        // extract referenced users....
        //
        o.message.replace(/@(\w+)/g, (_,uname)=>referencedUnames.push(uname) );

        if( referencedUnames.length>10 )
        {
            throw new Error("You referenced too many users... current limit is 10. You referenced: "+referencedUnames.length );
        }

        //
        // collect @mentions
        //
        if( referencedUnames.length ) 
        {
            // obtener mentions...
            let mentions = await getUsersByUname( referencedUnames );

            //
            // agregar las mentions que no hayamos ya referenciado...
            //
            mentions.forEach( u=>tos.push( u.id ) );  
        }

        //
        // quitar duplicados...
        //
        tos = tos.filter( (v,i,arr)=>arr.indexOf(v)==i );
        //#endregion 
    } 

    //
    // enviamos...
    //
    return await _insertMessage( tos , { 
        uid         : o.by,
        subject     : isDM? "DM" : jcommentSubject( o.jownerUname, o.ymd ),
        message     : o.message, 
        logid       : o.logid || 0 , 
        parentid    : o.parentid || 0
    });    
 
}


/**
 *  hace que el _insertMessage devuelva la data del mensaje creado
 * cosa de que pueda ser utilizado por el resover de post comment para devovler 
 * el union "SendMessageResult"
 * 
 */ 