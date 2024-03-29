
import { query } from "../../connection.js";
import { decode, encode } from 'html-entities';
import {slugify} from "../../../utils/slugify.js";
import { LIKE_TYPES } from "../likes-and-follows.js";
import { extractReferencedUsers, getUsersRefsNotBlocked } from "../inbox.js";
import { sendEmail } from "../../../utils/send-email.js";
import EmailTemplate from "../../../email/template.js";
import { escapeHTML } from "../../../utils/escapeHTML.js";
import {packAsToken} from "../../../utils/token.js"; 
import extractUserDataFromRow from "../../../utils/extractUserDataFromRow.js";
import { COOLDOWN_SECONDS_BEFORE_REPOSTING, SECTIONS, FORUM_ROLES, getForumSections as getSections, getForumRoleById , FORUM_ROLE_ACTION } from "./data.js"

/**------------------------------------
 * 
 *  Important: a "@mention" will be equal to a post, but will have no text and `section_id` will be CERO. uid will be the user being mentioned, and parent_id will point to the comment in which it was mentioned.
 * 
 * ------------------------------------
 */ 



export const ForumResolver = {
    Query: {

        getForumSections: async (parent, args, context) =>{ 

            const stats = await query(`SELECT 
                                            section_id,
                                            SUM(CASE WHEN parent_id = 0 THEN 1 ELSE 0 END) AS threads,
                                            SUM(CASE WHEN parent_id > 0 THEN 1 ELSE 0 END) AS replies
                                        FROM forum
                                        GROUP BY section_id
                                        `);

            const sections = await getSections();
            
            return await Promise.all(sections.map( async section=>{

                let sectionItem = {
                    ...section,
                    threads: stats.find( stat=> stat.section_id== section.id )?.threads ?? 0,
                    replies: stats.find( stat=> stat.section_id== section.id )?.replies ?? 0
                }; 

                if( section.getThreadCount )
                {
                    sectionItem.threads = await section.getThreadCount();
                }

                return sectionItem;

            }))
        },

        // 1: general
        // 2: ?
        // 3: nutricion
        // 4: help/suggestions/bug reports
        // sectionId:ID, includeReplies:Boolean, olderThan:UTCDate, limit:Int

        /**
         * it finds all messages in the sectionID
         * but if sectionId == by--XXX it will get all messages from that user with thread_id=0
         */
        getForumMessages: async (parent, args, context) =>{ 
            const limit         = args.limit || 10;
            const olderThan     = args.olderThan || new Date(); //toUTCString

            let sql = `SELECT * FROM forum WHERE`;
            let queryParams = [];
            let section;

            //#region resolve section id
            if( args.sectionId.indexOf("by--")==0 )
            {  
                const uname = args.sectionId.replace("by--", "");
                const user  = await query(`SELECT id FROM users WHERE uname=?`, [uname]);

                if( user?.length<=0 )
                { 
                    throw new Error(`Can't find user ${uname}`)
                }

                sql += ` (uid=? AND section_id>0) `; //<-- mentions are stored in the same table but they all have section_id=0
                queryParams.push( user[0].id );
            }
            else 
            {
                let sectionId = args.sectionId;

                const sections      = await getSections(); 
                section             = sections.find(s=>s.id==sectionId ||s.slug==sectionId);

                if(!section )
                {
                    throw new Error("Unknown forum section: "+sectionId);
                }

                sectionId = section.id;
                  

                sql += ` section_id=? AND thread_id=0`; 
                queryParams.push( sectionId );
            }
            //#endregion
 
            sql             += ` AND ${ args.olderThan? `fecha_de_publicacion<?` : '1=1' }  
                                 ORDER BY id DESC LIMIT ${limit}`;

            let msgs;               

            //
            // if the section hooks this method...
            //
            if( section?.getForumMessages )
            { 
                msgs = await section.getForumMessages()( args, limit );
            }
            else 
            {
                msgs = await query( sql , olderThan? [ ...queryParams, args.olderThan ] : queryParams );
            } 

            
            let users = [];

            if( msgs.length>0 )
            {
                const uids =  [ ...new Set(msgs.map( msg=> msg.uid )) ];
                const urows = await query(`SELECT * FROM users WHERE id IN (?)`, [uids]);

                users = urows.map( user=>extractUserDataFromRow(user) )
            }

            return {
                messages: msgs.map( mrow=>({
                    id: mrow.id,
                    when: mrow.fecha_de_publicacion,
                    user: mrow.uid,
                    sectionId: mrow.section_id,
                    threadId: mrow.thread_id,
                    parentId: mrow.parent_id,
                    message: decode( mrow.post_comment ),
                    replies: mrow.replies_count ?? 0,
                    note: mrow.post_preview.indexOf("@note:")==0? mrow.post_preview.replace("@note:", "") : undefined,
                })),
                users 
            }

        },

        //
        // always sorted from ID ASC
        //
        getThreadMessages: async (parent, args, context) =>{

            const limit         = args.limit || 10;  
            let messages        ;

            let thread          = await query(`SELECT * FROM forum WHERE id=?`, [ args.messageId ]);

            let sectionHook     = SECTIONS.find( s=> s.idIsMine && (s.idIsMine(args.messageId) || s.idIsMine(thread[0]?.post_comment)) );

            if( sectionHook )
            {
                let threadRow = thread[0];

                thread      = [];
                messages    = await sectionHook.getThreadMessages()( threadRow, limit, thread );
            }
            else 
            {
                if( !thread.length )
                {
                    throw new Error("The thread doesn't seem to exist...");
                }  

                //
                // get all messages of the thread...
                //
                messages        = await query(`SELECT * FROM forum 
                                                WHERE (thread_id=? OR id=?) 
                                                AND section_id>0  # exclude mentions...
                                                ORDER BY id ASC LIMIT ${limit} ${args.offset? `OFFSET ${args.offset}` : ''}`, [ args.messageId,args.messageId ]);
            }  


            let users           = []; 

            //
            // referenced users...
            //
            if( messages.length>0 )
            {
                const uids =  [ thread[0].uid, ...new Set(messages.map( msg=> msg.uid )) ];
                const urows = await query(`SELECT * FROM users WHERE id IN (?)`, [uids]);

                users = urows.map( user=>extractUserDataFromRow(user) );
            } 

            //#region likes/dislikes
            const msgsIds = messages.map(m=>m.id);
            // get all likes and dislikes for these messages
            if( msgsIds.length )
            {
                var likes = await query(`SELECT COUNT(*) as total, type_id, source_id AS id  FROM likes_history WHERE type_id IN (?) AND source_id IN (?) GROUP BY source_id, type_id`, [ [LIKE_TYPES.FORUM_MESSAGE_LIKE, LIKE_TYPES.FORUM_MESSAGE_DISLIKE], msgsIds ]); 
            }
            
            //#endregion

            return {
                messages: messages.map( mrow=>({
                    id: mrow.id,
                    when: mrow.fecha_de_publicacion,
                    user: mrow.uid,
                    sectionId: mrow.section_id,
                    parentId: mrow.parent_id,
                    message: decode( mrow.post_comment ), 
                    note: mrow.post_preview.indexOf("@note:")==0? mrow.post_preview.replace("@note:", "") : undefined,
                    replies: mrow.id==thread[0].id? thread[0].replies_count : null, //total replies only if the message is the thread starter

                    likes: likes?.find(row=>row.type_id==LIKE_TYPES.FORUM_MESSAGE_LIKE && row.id==mrow.id)?.total || 0,
                    dislikes: likes?.find(row=>row.type_id==LIKE_TYPES.FORUM_MESSAGE_DISLIKE && row.id==mrow.id)?.total || 0,
                })),
                users
            }

        },

        getForumPostIndex: async (parent, args, context) =>{
            const items = await query(`SELECT B.id 
                                        FROM forum AS A 
                                        INNER JOIN forum AS B 
 
                                            ON B.thread_id=A.id # A is main thread & B is a child of it
                                            OR B.id=A.thread_id # B is the main thread
                                            OR (B.thread_id=A.thread_id AND A.thread_id>0 AND B.section_id>0) # A is not the main thread, but B is child of the same thread & not a mention.
                                            OR B.id=A.id 

                                        WHERE A.id=? ORDER BY B.id ASC`, [args.postId]);

            if(!items.length)
            {
                throw new Error("The post doesn't seem to exist...");
            }

            return items.findIndex( row=>row.id==args.postId );
        },

        getForumRolesDescription: async (parent, args, context) =>{
            return Object.entries(FORUM_ROLES).map( r=>({
                key: r[0],
                title: r[1].title,
                description: r[1].description
            }));
        }
    },

    Mutation: {

        postForumMessage: async (parent, args, context) =>{ 

            let myId            = context.session?.id;
            let myUname         = context.session?.uname;
            let parentid        = args.parentId ?? 0; 
            let thread_id       = 0;
            let sectionId       = args.sectionId;
            let message         = args.message; 
            let mentionedUnames = [];
            let $sections       = SECTIONS;

            /**
             * to whom we are replying
             */
            let replyingToUID;
            let replyingToUname;
            let threadSlug;


            //#region PREVENT SPAM POSTING... ponele...
            //
            const lastTime = await query(`SELECT fecha_de_publicacion FROM forum WHERE uid=? ORDER BY id DESC LIMIT 1`, [ myId ]);
            if(lastTime.length)
            {
                const secondsSince = (new Date().valueOf() - lastTime[0].fecha_de_publicacion.valueOf()) / 1000;

                if( secondsSince<COOLDOWN_SECONDS_BEFORE_REPOSTING )
                {
                    throw new Error(`You recently posted less than ${COOLDOWN_SECONDS_BEFORE_REPOSTING} seconds ago, chill for a bit before posting again...`);
                }
                
            }
            //#endregion


            //#region checking arguments

            if( args.message.trim().length==0 )
            {
                throw new Error("The message is empty... try typing some text :)");
            }  



            if( parentid > 0 ) // check that the message we are replying belongs to the section...
            { 
                const parentMsg = await query(`SELECT A.id, 
                                                A.section_id, 
                                                A.thread_id, 
                                                A.uid, 
                                                B.uname AS messageAuthor,

                                                SUBSTRING( COALESCE(T.post_comment,A.post_comment), 1, 80 ) AS threadSlug


                                                FROM forum AS A  
                                                INNER JOIN users AS B ON B.id=A.uid
                                                LEFT JOIN forum AS T ON T.id=A.thread_id
                                                
                                                WHERE A.id=?`, [parentid]);

                if( !parentMsg.length)
                {
                    throw new Error("The referenced message does not exist");
                } 

                let parent = parentMsg[0];

                thread_id       = parent.thread_id || parent.id; // if it doesn't have a thread id, it IS the thread master.
                replyingToUID   = parent.uid;
                replyingToUname = parent.messageAuthor;
                sectionId       = parent.section_id;
                threadSlug      = slugify(parent.threadSlug);

                //#region did the user referenced the parentid's author in the reply? 

                if( message.match(/^\s*@[a-z0-9_]+/gi) )
                {
                    // someone is being mentioned... i'll assume this message is not intended t be directed to the parentid's author
                }
                else 
                {
                    //
                    // check if the user referenced the parentid's author in the reply
                    // 
                    const unameMatcher    = new RegExp(`(^|\W)@${parentMsg[0].messageAuthor}\b`,"gi");

                    if( !message.match(unameMatcher) )
                    {
                        message = "@"+parentMsg[0].messageAuthor+" "+message;
                    }
                }
                
                
                //#endregion

            }  
            //#endregion

            //#region resolve $section
            // isNaN = a slug is being used. And > 100 is a section that exists in the DB
            if( isNaN(sectionId) || sectionId>100 )
            {
                $sections      = await getSections(); 
            }

            let $section = $sections.find(s=>s.slug==sectionId || s.id==sectionId); 

            if( !$section )
            {
                throw new Error("I have no idea where you are trying to post this comment :/");
            } 
            else 
            {
                sectionId = $section.id;
            } 
            //#endregion

            if( $section.threadsCantBeCreated && parentid==0 )
            {
                throw new Error("Threads can't be created in this forum.")
            }
 
            const insert    = await query(`INSERT INTO forum SET ?`, {
                uid: myId,
                section_id: sectionId,
                parent_id: parentid,
                post_comment: encode( message ),
                fecha_de_publicacion: new Date() ,
                thread_id // 0 = a new thread
            }); 

            if( !insert.insertId )
            {
                throw new Error("The message could not be posted...");
            }

            /**
             * Absolute path link to the post. (used to send this vía email...)
             */
            let linkToPost = "https://weightxreps.net/forum/"+$section.slug+"/"+thread_id+"/"+threadSlug+"/locate--"+insert.insertId;


            //#region notify vía Email to the parent's user
            //
            // notify the user of the parentMessage that we are replying....
            //
            if( replyingToUID != myId )
            {  
                notifyUserViaEmail( replyingToUID, replyingToUname, myId, myUname, `${myUname} replied to your forum post`, message, $section.name, linkToPost );
            }
            //#endregion
            

            //
            // update the "replies" counter of the Thread & the parent message.
            //
            if( parentid )
            {
                await query(`UPDATE forum SET replies_count=replies_count+1 WHERE id IN (?)`, [ [thread_id, parentid] ]);   
            }

            //#region MENTIONS
            //
            // notify mentioned unames
            //
            try
            {
                //
                // extract mentioned users by username...
                //
                const urefs         = await extractReferencedUsers( message, 10 );

                //
                // mentions: exclude session user and the target of the reply. 
                //
                const mentions      = urefs?.filter( u=> ( u.id!=myId && (!replyingToUID || u.id!=replyingToUID) ) ); 
    
                if( mentions?.length )
                { 
                    //
                    // filter out cases where the user blocked the mentioned user or vice versa...
                    //
                    const users = await getUsersRefsNotBlocked( myId, mentions.map(m=>m.id) ); 

                    const mentionedUsers = users.filter((_,i)=>i>0) // <--- skip the first item, that is the user who is posting the message.
                        
                                            .map( u=>[ 
                                                u.id, 
                                                0,  
                                                (thread_id || insert.insertId), 
                                                insert.insertId, 
                                                "", 
                                                "", 
                                                0, 
                                                0, 
                                                new Date() ] );

                    if( mentionedUsers.length )
                    {
                        //
                        // we insert a "mention" as a comment that has everything at 0 but the parentid
                        //
                        const mentionInsert = await query(`INSERT INTO forum (uid, section_id, thread_id, parent_id, post_preview, post_comment, replies_count, post_views, fecha_de_publicacion ) VALUES ?
                        `,[ mentionedUsers ]);
 
                        //
                        // notify mentioned vía email ( slice1 because the 1st user will be session user )
                        //
                        notifyUserViaEmail( users.slice(1), null, myId, myUname, `${myUname} mentioned you on a forum post`, message, $section.name, linkToPost );
                        
                    } 
                    
                }
            }
            catch(e)
            {
                console.error(e)
                //
                // ignore errors related to mentions..
                //
            } 
            
            //#endregion

            return insert.insertId; 
        },

        /**
         * Sets a note in a message. This is done by a moderator.
         */
        setForumPostNote: async (parent, args, context) =>{
            let myId            = context.session?.id;
            const role          = await getUserForumRole( myId );

            //#region checks
            if( !args.note || args.note.trim().length==0 )
            {
                throw new Error("You must provide a note to add...");
            }

            if(!role || !role.canDo( FORUM_ROLE_ACTION.note ) )
            {
                throw new Error("You don't have permission to add a note to this message...");
            }

            const msg = await query(`SELECT * FROM forum WHERE id=? `, [ args.messageId ]);

            if( !msg?.length>0 )
            {
                throw new Error("The message you are trying to add a note to doesn't seem to exist...");
            }

            if( !msg[0].section_id )
            {
                throw new Error("You can only add notes to messages.");
            } 

            if( msg[0].post_comment=="" )
            {
                throw new Error("You can't add a note to a deleted message.");
            }
            //#endregion

            const remove = args.note=="x";

            const result = await query(`UPDATE forum SET post_preview=? WHERE id=?`, [ remove? "" : "@note:"+args.note, args.messageId ]);

            if( !result.changedRows )
            {
                throw new Error("Weird... nothing was changed.");
            }

            return !remove;

        },

        //
        // sets the message to ""
        //
        deleteForumMessage: async (parent, args, context) =>{
 
            let myId            = context.session?.id; 
            let reason          = "";
            const msg           = await query(`SELECT * FROM forum WHERE id=? `, [ args.id ]);

            if( !msg.length>0 )
            {
                throw new Error("The message you are trying to delete doesn't seem to exist...");
            }
             
            let section = SECTIONS.find(s=>( s.id==msg[0].section_id && !msg.thread_id && s.threadsCantBeDeleted ) );
            if( msg[0].thread_id==0 && section )
            {
                throw new Error(`Threads in forum [${section.name}] can't be deleted.`);
            }


            if( msg[0].uid != myId )
            {
                const role = await getUserForumRole( myId );

                if( !role.canDo( FORUM_ROLE_ACTION.delete ) )
                {  
                    throw new Error("You don't have permission to delete this message...");
                }

                if( !args.why || args.why.trim()=="" )
                {
                    throw new Error("Please provide a breif motive for wanting to delete this comment.");
                }

                reason = "@note:"+ args.why;

                if( msg[0].section_id==0 )
                {
                    throw new Error("You can only delete comments, this message is not a comment.");
                }
            }

            const deleted = await query(`UPDATE forum SET post_comment="", post_preview=? WHERE id=?`, [ reason, args.id ]);
            return deleted.changedRows >0;
        }
    }
} 


const getUserForumRole = async uid => {
    const user = await query(`SELECT forumRole FROM users WHERE id=?`, [ uid ]);
    if( user?.length>0 )
    {
        return getForumRoleById( user[0].forumRole );
    }
    else 
    {
        throw new Error("Can't find user with id:"+uid)
    }
}  
 

/**
 * Total posts (including threads) done by a user in the forum.
 */
export const getTotalForumPostsBy = async uid => {
    try 
    {
        const posts = await query(`SELECT COUNT(*) AS total FROM forum WHERE uid=? AND section_id>0`, [uid]);
        return posts[0].total;
    }
    catch(e) {
        return;
    }
}

/**
 * Get it as an object intended to be sent to the front-end
 */
export const getForumStatusJsObject = async user => {

    //
    const role = await getForumRoleById( user.forumRole ); 

    return {
        posts: await getTotalForumPostsBy(user.id),
        role : role?.toJs() 
    }

}

/**
 * if `toUid` is an array then `toUname` is ignored.
 * 
 * @param {Array<{ id:number, uname:string}>|number} toUid 
 * @param {string } toUname 
 * @param {number} byId 
 * @param {string} byUname 
 * @param {string} subject 
 * @param {string} message 
 * @param {string} forumSectionName 
 * @param {string} linkToPost 
 */
function notifyUserViaEmail( toUid, toUname, byId, byUname, subject, message, forumSectionName, linkToPost ) 
{ 
    try
    {
        const tos = Array.isArray(toUid)? toUid.map(to=>to.id) : [toUid];

        sendEmail( tos, subject,   
            //
            // email body...
            //
            touid => EmailTemplate(`Hello <strong>${ toUname ?? toUid.find(u=>u.id==touid).uname }</strong>`, 
                                `${ byUname } wrote to you on the forum: ${forumSectionName}:`, //<-- IDK why the link above doesn't show in gmail...
                                escapeHTML( message ),
                                "Go to message",
                                linkToPost,
                                "http://weightxreps.net/unsub?key=" + packAsToken({ uid:touid })
                                ) 
        );
    }
    catch(e)
    {
        //ignore errors
    } 

}