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
             
            const myID = context.session.id;

            // return {
            //     notifications:[],
            //     referencedUsers:[]
            // }; //throw new Error("Some crazy error");

            //
            // Si es ADMIN y pide dms de "0", está pidiendo los GLOBALS
            //
            if( context.session.id==1 && args.dmsWithUID==0 )
            {
                const notifications = await InboxResolvers.Query.getAnnouncements( parent, args, context );

                if( notifications?.length )
                {
                    notifications.forEach( n=>n._type=n.__typename );
                }

                return {
                    notifications,
                    //referencedUsers: []
                }
            }


            //
            // UN SOLO ITEM POR USUARIO...
            // hay 2 tipos de "inbox" results... uno se usa para el popmenu, el otro en la dm window.
            //
            if( !args.dmsWithUID ) //<--- items para la ventana del notifications pop menu...
            {    

                //#region DMs y JComments...
                //
                // solo queremos 1 item por usuario....
                // Esto emula el mecanismo del front. Donde el pop menu de notificaciones agrupa los mensajes por usuario. Generando 1 item por usuario.
                //
                const perUserParams = [ myID, myID ];

                if( args.olderThan )
                {
                    perUserParams.push(args.olderThan);
                }
                else if( args.newerThan )
                {
                    perUserParams.push(args.newerThan);
                }

                //
                // 1) Direct Messages (enviados y recibidos) y JComments (solo recibidos)
                // 
                //
                const dmsAndComments = await query(`SELECT * FROM ( 

                                                    SELECT MAX(A.id) AS id, A.touid, B.uid AS fromid, IF(A.touid=${myID}, B.uid, A.touid) AS targetid,  MAX(B.fecha) AS fecha
                                                        FROM message_to AS A INNER JOIN messages AS B On B.id=A.msgid 
                                                        WHERE 

                                                        B.isGlobal=0 AND B.uid>0 
                                                        AND ( A.touid=? OR (B.uid=? AND B.logid=0) )
                                                        ${ myID=="1"? ` AND NOT ( B.subject LIKE "%elcome to weight%" AND B.uid=1 AND B.parentid=0 )  ` : "" }
                                                        AND B.uid != A.touid  
                                                        #GROUP BY fromid 
                                                        GROUP BY targetid
                                                     
                                                ) AS X
                                                
                                                WHERE 1 
                                                
                                                ${ args.olderThan? " AND fecha<?" : "" }
                                                ${ args.newerThan? " AND fecha>?" : "" }

                                                ORDER BY fecha ${ args.newerThan!=null?"ASC":"DESC" }

                                                LIMIT ${ LIMIT }
                                                `, perUserParams); 

                                                //console.log("DMs y Comments length", dmsAndComments.length);
                //#endregion


                //#region EVENTOS y GLOBALS
                //
                // 2) notificaciones...
                //
                const capEvents     = dmsAndComments.length==LIMIT; //el query anterior limito sus items... por lo que hay que mantenernos dentro de su cuadro...
                const eventsParams  = [myID];
                var CAP_EVENTS      = "";

                // si tiene 3 es porque el query anterior uso limite de fecha.
                perUserParams.length==3 && eventsParams.push(perUserParams[2]);

                //
                // "capear" means: un LIMIT genera un "cuadro" ( un "marco" ) de resultados...
                // al appendearle otra tanda de resultados, los mismos deben vivir dentro del mismo espacio de tiempo
                // sino el UI del front va a fallar. 
                //
                if( capEvents )
                {
                    if( args.newerThan )
                    {
                        CAP_EVENTS = " AND fecha <= ?";
                        eventsParams.push( dmsAndComments.slice(-1)[0].fecha );
                    }
                    else 
                    {
                        CAP_EVENTS = " AND fecha >= ?";
                        eventsParams.push( dmsAndComments.slice(-1)[0].fecha ); 
                    }
                }

                const eventsAndGlobals = await query(` 
                                            SELECT A.id, A.touid, B.uid AS fromid, B.fecha 
                                                FROM message_to AS A INNER JOIN messages AS B On B.id=A.msgid 

                                                WHERE (B.isGlobal=1 OR B.uid=0)  
                                                AND A.touid=?
                                                AND NOT (B.subject LIKE "%welcome to weight%" AND B.uid=1 AND B.parentid=0) 
                                                
                                                ${ args.olderThan? " AND fecha<?" : "" }
                                                ${ args.newerThan? " AND fecha>?" : "" }

                                                ${CAP_EVENTS}

                                                ORDER BY fecha ${ args.newerThan!=null?"ASC":"DESC" }
                                                LIMIT ${ LIMIT }
                                                `, perUserParams);
                //#endregion

                //
                // obtener info de estos mensajes solamente (ya pre-filtrados por fecha...)
                //
                var soloEstosMessageToIDs = [ ...dmsAndComments, 
                                              ...eventsAndGlobals ] .map(row=>row.id); 

                //
                // soloEstosMessageToIDs puede ser un empty []
                //
            }

 
            //
            // continuar normalmente...
            //
            const response = await _getNotifications({ 
                $soloEstosIDs   : soloEstosMessageToIDs, //<-- puede ser null. O un array de numeros.
                $onlyThisLOG    : args.dmsWithUID>=0? 0 : null,
                $onlyTo         : myID,
                $onlyFrom       : args.dmsWithUID,
                $twoWays        : args.dmsWithUID>0, // 2 ways si estamos en modo "DM"
                myID            ,

                olderThan       : args.olderThan,
                newerThan       : args.newerThan,

                partialMessages : args.dmsWithUID == null //traer textos parciales...
            });


            //
            // Caso del boton "DM Admin"
            //
            if( !response && args.dmsWithUID==1 )
            {
                const admin = await query(`SELECT * FROM users WHERE id=1`); 
                let USR         = new UserFieldsManager("","");
                
                return {
                    notifications:[],
                    referencedUsers:[
                        USR.extractUserData(admin[0])
                    ]
                }

            }

            return response;

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
                myID            : context.session?.id,
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
 * @property {[number]|null} $soloEstosIDs - null | Array de ID de message_to a analizar.
 * @property {number} $onlyThisLOG - >0 = solo cosas con ese logid... 0 = Direct Messages only
 * @property {number} $onlyTo -solo enviados a ese usuario
 * @property {boolean} $twoWays -incluir tambien, aparte del from->to  el caso to->from 
 * @property {number} myID -El ID del usuario actual que esta llamando esta funcion.
 * @property {Date} olderThan -devolver cosas older than esta fecha
 * @property {Date} newerThan -devolver cosas newer than esta fecha
 * 
 * @param {_getNotificationsParams} param0 
 * @returns 
 */
 const _getNotifications = async ({

    $soloEstosIDs   ,
    $onlyThisLOG    ,
    $onlyTo         ,  
    $onlyFrom       ,  
    $twoWays        ,
    myID            ,
    olderThan       ,
    newerThan       ,
    partialMessages = false,
    noLimit         = false,
}) =>{   
            
    /*
    const $onlyThisLOG      = null;                     // solo cosas con ese logid... 
    const $onlyTo           = 1;                        // solo enviados a ese usuario
    const $onlyFrom         = 3;                     // solo enviados POR ese usuario. (el "by" debe ser solo ese...)
    const $twoWays          = true;                    // incluir tambien, aparte del from->to  el caso to->from  
    */
    
    //let myID            = context.session.id;  
    const DM_MODE = $onlyFrom!=null && $onlyTo!=null;

    const $wantsEverything = (!$onlyThisLOG && !$onlyTo && !$onlyFrom );
    
    //
    // si se especifica un logid pero no un "to" ni un "from" se puede dar el caso de que un mensaje se le 
    // haya enviado a multiples usuarios (caso mentions usando el @pepe @otro etc...)
    // en ese caso, solo devolver el primer "message_to" 
    // ----- else -----
    // no habría problema, porque el filtro "to" o "from" se encargaría de solo seleccionar 1.
    //
    const $ignoreMentions   = $wantsEverything || ( $onlyThisLOG > 0 && !$onlyTo && !$onlyFrom );  

    //
    // si referencian al admin o a nadie.
    //
    //const $ignoreGlobals     = $wantsEverything || $onlyTo==1 || $onlyFrom==1 ;

    //
    // incluir DMs y Likes a DMs hehcos por el "to" user.
    //
    const $includeSentByTo  = $onlyTo>0 && !$onlyFrom;  


    const BY            = new UserFieldsManager("D","by_");
    const TO            = new UserFieldsManager("E","to_"); 
    const JOWNER        = new UserFieldsManager("F","jowner_"); 

    let extraWHERE      = "";
    let queryParams     = [];
    let reverse         = false; 
    var queryDateLimit  ;
    
    //
    // quito los mensajes automaticos que envío en nombre de uid=1 para no saturar mi inbox
    //
    //let removeWelcomeMessagesSentByAdmin = myID==1? `AND NOT (B.subject LIKE "%welcome to%" AND B.uid=1) ` : "";

    //#region date range selection
    if( olderThan ) 
    {
        extraWHERE = " AND (B.fecha < ? )";
        //queryParams.push( args.olderThan ); 

        //
        // porque se usa 3 veces...
        //
        queryParams         = new Array(2).fill(olderThan);
        queryDateLimit      = olderThan;
    }
    else if( newerThan ) 
    {
        extraWHERE = " AND (B.fecha > ? )";
        ///queryParams.push( args.newerThan ); 
        reverse = true;

        //
        // porque se usa 3 veces...
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

                            WHERE 1 

                                ${ $soloEstosIDs ? " AND A.id IN (?) ":` 

                                        #{/* $ignoreGlobals? " AND B.isGlobal=0 ":"" */}#--- incluye globals... (convertirlos a DM si es DMsWith...)
                                        
                                        #
                                        # LOGID filter
                                        #
                                        ${ $onlyThisLOG!=null? " AND B.logid="+$onlyThisLOG :"" } # Only this log...

                                        #
                                        # EVRTYTHING...
                                        #
                                        ${ $wantsEverything? " AND B.logid>0 ":""}

                                        #
                                        # TWO WAYS IF wrapper...
                                        #
                                        ${$twoWays?" AND (( 1 ":""}


                                            #
                                            # include sent-by-to wrapper
                                            #
                                            ${ $includeSentByTo? " AND (( 1 ":"" }

                                                #
                                                # TO filter
                                                #
                                                ${ $onlyTo? " AND A.touid="+$onlyTo : ""}

                                                #
                                                # FROM filter
                                                #
                                                ${ $onlyFrom? " AND B.uid="+$onlyFrom : ""}

                                            #
                                            # include sent-by-to wrapper : DMs enviados por el "to"
                                            #
                                            ${ $includeSentByTo? `) OR ( B.uid=${$onlyTo} AND B.logid=0 ))`:"" }


                                        #
                                        # TWO WAYS
                                        #
                                        ${$twoWays?`) OR ( B.uid=${$onlyTo} AND A.touid=${$onlyFrom} ) )`:""} 

                                    #
                                    # solo 1 mensaje por msg.id
                                    # 
                                    ${$ignoreMentions?` GROUP BY A.msgid ` : ""} 

                                    #
                                    # fecha filter...
                                    #
                                    ${extraWHERE} ORDER BY B.fecha ${reverse?"ASC":"DESC"} 

                                    
                                    ${noLimit? "":`LIMIT ${LIMIT}`} 
                            `} 

                        ) AS AB
                        #  
                        # ordenar de mas recienta a mas viejo...
                        #
                        ORDER BY AB.fecha DESC`;  

    let likesSQL = `
                    SELECT * FROM (
                    # ----------------------------------------------------------------------------------------------------------------------------------------
                    # JOURNAL LIKES ( un like al JLog ) :: likes hechos a un LOG en un día particular...
                    # 
                    SELECT      A.id AS notificationID, 
                                IF( A.type_id=1, C.uid, B.uid ) AS touid,      
                                0 AS id, 
                                0 AS topic, 
                                0 AS isGlobal, 
                                A.uid, 
                                IF( A.type_id=1, "like-on-log", "like-on-comment") AS subject,  
                                B.message , # puede ser null
                                A.fecha, 
                                IF( A.type_id=1, 0, A.source_id )       AS parentid,  
                                C.id AS logid, 
                                C.fecha_del_log AS ymd,
                                0 as parentuid,

                                ${ BY.userFieldsQuery() },
                                ${ TO.userFieldsQuery() },
                                ${ JOWNER.userFieldsQuery() } 
                                
                            
                        FROM likes_history AS A 

                        LEFT JOIN messages AS B   ON A.type_id=3  AND B.id=A.source_id                                                  # info del comment... 
                        LEFT JOIN logs AS C       ON C.id=IF( A.type_id=1, A.source_id, IF( A.type_id=3, B.logid, 0 ) )

                        ${ BY.innerJoinOnIdEquals("A.uid") }
                        ${ TO.innerJoinOnIdEquals("IF( A.type_id=1, C.uid, B.uid )") }
                        ${ JOWNER.leftJoinOnIdEquals("C.uid") }


                        #
                        # 1=like on Log   3=like con message
                        #
                        WHERE 

                            #
                            #  solo likes en journal o comments.
                            #
                            (A.type_id=1 OR A.type_id=3) 

                            #
                            # Everything
                            #
                            ${ $wantsEverything? " AND C.id>0 ":""}

                            #
                            # LOGID filter
                            #
                            ${ $onlyThisLOG!=null? " AND C.id="+$onlyThisLOG :"" } 


                            #
                            # TWO WAYS IF wrapper...
                            #
                            ${$twoWays?" AND ( ( 1 ":""}


                                #
                                # include sent-by-to wrapper
                                #
                                ${ $includeSentByTo? " AND (( 1 ":"" }
                                    #
                                    # TO filter
                                    # 
                                    ${$onlyTo? " AND  IFNULL(B.uid,C.uid)="+$onlyTo : ""}

                                    #
                                    # FROM filter
                                    #
                                    ${$onlyFrom? " AND A.uid="+$onlyFrom : ""}

                                #
                                # include sent-by-to : solo likes a mensajes de tipo DM (no journal comments)
                                #
                                ${ $includeSentByTo? `) OR ( A.type_id=3 AND A.uid=${$onlyTo} AND B.logid=0 ))`:"" }

                            #
                            # TWO WAYS Filter...
                            #
                            ${$twoWays?`) OR ( IFNULL(B.uid,C.uid)=${$onlyFrom} AND A.uid=${$onlyTo} ))`:""}

                            #
                            # Fecha filter...
                            #
                            ${extraWHERE.replace("B.fecha","A.fecha")} 
                            
                            %_CAP_PLACEHOLDER_%
                            
                            ORDER BY A.fecha ${reverse?"ASC":"DESC"} 

                            ${noLimit? "":`LIMIT ${LIMIT}`} 

                            ) AS AB
                            #  
                            # ordenar de mas recienta a mas viejo...
                            #
                            ORDER BY AB.fecha DESC 
                            `;

    /**
     * en el contexto del inbox popmenu... solo queremos 1 item por usuario.
     *      - la fecha del filtro que viene se lee como: dame los items cuya notificacion mas reciente (no todas) sea mas vieja (o nueva) que la fecha que vino...
     *      - el limit debe entender que es sobre los ITEMS y no sobre las notificaciones... 
     *         porque un item puede tenes 10 notifs y con fecha re vieja y eso arruinaria el limit...
     * ---------------------------------
     * obtener los message_to ID de los items a mostrar y correr este select contra esos IDs only...
     * ---
     *  SELECT MAX(A.id), A.touid, B.uid AS fromid, MAX(B.fecha)
        FROM message_to AS A INNER JOIN messages AS B On B.id=A.msgid 
        WHERE B.isGlobal=0 AND B.uid>0 AND A.touid=1 GROUP BY touid, fromid;
     * en el contexto de un DM, queremos todos los mensajes.
        ----

        Al obtener los mensajes, query los likes entro del rango de tiempo normal + ponerle un cap al older than...
        --si hay mensajes. Que el like when no sea mas viejo que el mensaje mas "viejo"
        -- pero si los items devueltos son menores al LIMIT. remover esa reestriccion... (significa que no hay mas items anyway...)
     */
 

    if( $soloEstosIDs )
    {
        queryParams.unshift( $soloEstosIDs );
    }
    

    //
    // get notifications...
    //
    let rows = $soloEstosIDs && $soloEstosIDs.length==0? [] : await query( $sql, queryParams);  


    //
    // "append" los likes.... exec likesSQL con el time limit correspondiente...
    // Nunca devolver nada mas viejo que rows a menos que rows.length sea < al LIMIT (lo cual significaria que ya se vió todo...)
    // nunca devolver mas nuevo que rows a menos que rows.length<LIMIT (lo cual significa que ya vio todo...)

    //console.log("MESSAGES LENGTH", rows.length );
    await __appendNotifications( likesSQL, rows, queryDateLimit, newerThan==null );


    if( rows.length==0 ) 
            return null;  

    //
    // convert to graphql format
    //
    return await getInboxGraphQLResponse( rows, BY, TO, JOWNER, myID, partialMessages, DM_MODE );   
}


/**
 * 
 * @param {*} sql 
 * @param {*} out 
 * @param {Date} dateLimit -se usa para olderThan o newerThan
 */
const __appendNotifications = async ( sql, out, dateLimit, askingForOlder ) => {

    //
    // parametros para el SQL...  olderThan:dateLimit + if cap=true  notOlderThan (fechaMasViejaDelOut)
    //                            newerThan:limit + if cap=true notNewerThan fecha mas reciente del out...
    //
    const params = [  ]; 

    dateLimit && params.push(dateLimit);

    //
    // si hay menos del LIMIT significa que ya no hay nada mas (sea olderThan o newerThan) ya se vió todo, por lo que
    // si se devuelve fechas que vayan mas alla de lo que devuelve el main query, todo estaría bien.
    //
    const capRange = out.length>=LIMIT;
 

    if( capRange && out.length)
    {
        //
        // mantener los resultados del query dentro del rango de fechas del query principal.
        // esto es para que el boton de "fetch more" del front funcione bien... 
        //
        const capDate = askingForOlder? out.slice(-1)[0].fecha : out[0].fecha;

        //console.log("CAP DATE", capDate )
        params.push( capDate );

        //
        //  askingForOlder? cap fecha a no mas vieja que la fecha mas vieja del "main" query
        // !askingForOlder? cap fecha a no mas nueva que la más nueva del "main" query
        //
        sql = sql.replace("%_CAP_PLACEHOLDER_%", " AND (A.fecha"+(askingForOlder?" >= ?":" <= ?")+") " ); 
    }
    else 
    {
        sql = sql.replace("%_CAP_PLACEHOLDER_%",""); 
    }

    //
    // ejecutar el query...
    //
 
    const likesResult = await query( sql, params );  
    
    //
    // append results to "out"
    //
    if( likesResult.length )
    {
        Array.prototype.push.apply( out, likesResult );
    }

}
 



/**
 * Convierte el resultado de mysql al que requiere el graphql schema
 */
const getInboxGraphQLResponse = async ( rows, BY, TO, JOWNER, myID, partialMessages=false, DM_MODE=false ) => {

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
                        throw e; 
                    }
                } 


                let isSent         = by.id==myID;
                const fromMeToMe   = by.id==to.id; 


 
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

                    if( DM_MODE )
                    {
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
                        });   
                    }
                    else 
                    {
                        notifications.push({ 
                            _type       : "SystemNotification",
                            id          : row.id  , // row.id = message.id
                            type        : "info",
                            //text        : row.message ,
                            text: _globalSubjectAndText2Message( row.subject, row.message ),
                            when        : row.fecha
                        });
                    }
                    
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