import { query } from "../../connection.js";
import { SECTIONS, getForumSections } from "./data.js";
import { resolveForumPointers } from "./helpers.js";

/**
 * Gets the notifications related to new replies in forum's threads or to comments done by the user.
 */
export const getForumMessagesNotifications = async ($toUID, $where, reverse, whereParams, LIMIT, BY, TO, JOWNER) => {

    //buscar todos los threads hechos por este usuario
    //y todos los replies con esos threadids...
    const messages = await query(`
        SELECT
       
            A.id AS notificationID,
            A.section_id,
            C.section_id AS parentSectionId,
            C.id AS parentId,

            A.thread_id,
            SUBSTRING( B.post_comment, 1, 80 ) AS threadTitle,
            SUBSTRING( C.post_comment, 1, 80 ) AS parentThreadTitle, 

            (A.section_id=0) AS isMention,

            A.fecha_de_publicacion AS fecha,
            "forum-message" AS subject,

            A.post_comment AS message,
            C.post_comment AS parentMessage,

            ${ BY.userFieldsQuery() },
            ${ TO.userFieldsQuery() },
            ${ JOWNER.userFieldsQuery() }
        

        FROM forum AS A

        #
        # here we do inner join, because notifications are sent for messages that are a reply to something. A thread_id=0 or parent_id=0 will never be notified to anyone.
        #
        INNER JOIN forum AS C ON C.id=A.parent_id 
        INNER JOIN forum AS B ON B.id=A.thread_id
        

        ${ BY.innerJoinOnIdEquals("A.uid") } # message's Author
        ${ TO.innerJoinOnIdEquals("C.uid") } # Replying to this user
        ${ JOWNER.leftJoinOnIdEquals(["B.uid","A.uid"]) } # Thread Owner

        WHERE 
            (
                (
                ( C.uid=${$toUID}           # a reply to a message we posted.
                    OR B.uid=${$toUID}      # a comment in one of our threads (not necesarly to us...)
                ) 
                AND A.uid!=${$toUID}        # author of the message is not us.
                AND A.section_id>0          # message has a section ( mentions have section=0 )
                ) 
                OR 
                ( A.uid=${$toUID} AND A.section_id=0 ) # it is a mention, someone mentioned us using the @XXX syntax
            )

            ${$where.replace(/\.fecha\b/g,".fecha_de_publicacion")}

            ORDER BY A.fecha_de_publicacion ${reverse?"ASC":"DESC"} 
            ${ LIMIT ? `LIMIT ${LIMIT}` : "" } 

    `, [whereParams]);


     
    //#region resolve message pointers
    const possiblePointers = ["threadTitle","parentThreadTitle","message","parentMessage"];
 
    //
    // some of the texts "point" to text in other tables...
    //
    await resolveForumPointers( messages, possiblePointers );

    //#endregion

    // encontrar la posisión del item en el thread...
    var $sections   = SECTIONS;
    var sectionIds    = [ ...new Set(messages.map(r=>r.section_id)) ]; // unique section IDs
    //var threadIds   = [ ...new Set(messages.map(r=>r.thread_id)) ]; // unique thread IDs
 
    if( sectionIds.some(s=>s>100 ) )
    {
        $sections      = await getForumSections();
    }   

    //
    // in the case of a mention, "TO" is the one who mentioned us ("BY" in this case)
    //
    return messages.map( m=>({
        ...m, 
        forumSlug   : $sections.find( s=>s.id == (m.isMention==1? m.parentSectionId : m.section_id) ).slug,
        threadId    : m.thread_id,
        threadSlug  : slugify( m.threadTitle.substring(0,80) ) ,
        postId      : m.isMention==1? m.parentId : m.notificationID
    }));


}