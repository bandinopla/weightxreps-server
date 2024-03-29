import { query } from "../../connection.js";

export async function getAnnouncementsAsMessages (args, limit) {

    // id, fecha_de_publicacion, uid, section_id, thread_id, parent_id, parent_id, post_comment, replies_count, post_preview 

    const globalMessages = await query(`SELECT * FROM messages WHERE isGlobal=1 
                                        AND ${ args.olderThan? `fecha<?` : '1=1' } 
                                        ORDER BY id DESC LIMIT ${limit}`, [ args.olderThan ]);
                                         

    const threads = globalMessages.map( row=>({
        id:"global:"+row.id,
        fecha_de_publicacion: row.fecha,
        uid:row.uid,
        section_id: this.id,
        thread_id:0,
        parent_id:0,
        post_comment: row.subject,
        replies_count:0,
        post_preview:"" 
    }));

    // find proxies
    const proxies = await query(`SELECT * FROM forum WHERE ${ threads.map(t=>"post_comment=?").join(" OR ") }`, threads.map(t=>t.id));

    // merge proxy data
    proxies.forEach( proxy => {

        const thread = threads.find( t=>t.id==proxy.post_comment );
        if( thread )
        {
            thread.replies_count = proxy.replies_count; 
        }

    } );

    return threads;

}

export async function getAnnouncementsCount() {
    const total = await query(`SELECT COUNT(id) AS totalCount FROM messages WHERE isGlobal=1`);
    return total?.[0].totalCount ?? 0;
}

export async function getAnnouncementsThreadMessages ( forumThreadRow, limit, pushThreadHere ) 
{
    const globalId  = forumThreadRow.post_comment.replace("global:", "");
    const global    = await query(`SELECT * FROM messages WHERE id=?`, [ globalId ]);

    if(!global.length) 
    {
        throw new Error("You are trying to access an unexistent announcement.")
    }
 
    let thread = { 
        fecha_de_publicacion: global[0].fecha,
        uid:global[0].uid,
        section_id: this.id,
        thread_id:0,
        parent_id:0,
        post_comment: "#"+ global[0].subject+"\n"+global[0].message,
        replies_count:0,
        post_preview:"" 
    } 

    const proxy = await query(`SELECT * FROM forum WHERE post_comment=?`, [ args.messageId ]);

    if(!proxy.length) 
    { 
        const created = await query( `INSERT INTO forum SET ?`, { ...thread, post_comment: args.messageId } );

        if(!created.insertId )
        {
            throw new Error("Can't locate the announcement you are tyring to reach.")
        }

        thread.id = created.insertId;
    } 
    else 
    {
        let threadMsg = thread.post_comment;

        thread = proxy[0];
        thread.post_comment = threadMsg; //<-- put the full notice back.
    }


    // si hay replies se debe crear un mensaje con body = id del thread.
    const msgs = await query(`SELECT * FROM forum 
                                WHERE (thread_id=? OR id=?) 
                                AND section_id>0  # exclude mentions...
                                ORDER BY id ASC LIMIT ${limit} ${args.offset? `OFFSET ${args.offset}` : ''}`, [ thread.id,thread.id ]);

    pushThreadHere.push(thread);

    return msgs.map( msg => msg.id==thread.id? thread : msg  ); 
}

/**
 * Assumes ID is a pointer to a global message. It will return an array of the same size as input 
 * with the values being the text of the global message with the ID at that input position.
 * 
 * @param {Array<string>|string} id 
 * @returns {Array<string>}
 */
export async function getAnnouncementTextById( id ) {

    const pointers  = Array.isArray(id)? id : [id];
    const globalIds = pointers.map( p=>p.replace("global:", "") ); 
    const globals    = await query(`SELECT * FROM messages WHERE id IN (?)`, [ globalIds ]);

    return globalIds.map( id=>{
        const row = globals.find(g=>g.id==id);

        if(row ) return "#"+ row.subject+"\n"+row.message;

        return "???"
    } );
}