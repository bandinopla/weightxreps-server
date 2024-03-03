import { query } from "../connection.js";
import extractUserDataFromRow from "../../utils/extractUserDataFromRow.js";
import { getCached } from "../../utils/cache.js";
import { dateASYMD } from "../../utils/dateASYMD.js";

export const VideosResolver = {  
    Query: {
        getVideos: async (parent, args, context )=>{ 
   
                const results = await query(`
                                SELECT users.*, logs.id as logid, logs.log, logs.ultima_modificacion, logs.fecha_del_log
                                    FROM logs

                                    JOIN (
                                        SELECT id, uid, MAX(fecha_del_log) AS recent_date
                                        FROM logs
                                        WHERE log LIKE '%youtube.com%' OR log LIKE '%youtu.be%' OR log LIKE '%instagram.com%'
                                        GROUP BY uid
                                    ) AS recent ON logs.uid = recent.uid AND logs.fecha_del_log = recent.recent_date

                                    JOIN users ON users.id = logs.uid

                                    WHERE users.private=0 AND users.deleted=0

                                    ${ args.olderThan? " AND logs.ultima_modificacion<?":"" }

                                    ORDER BY ultima_modificacion DESC

                                    LIMIT ${ args.limit ?? 3 }

                                    `, args.olderThan? [args.olderThan]:null );

                return results.map( row=>{
                    
                    //youtube
                    var m = row.log.match(/(?:http(?:s?):\/\/(?:www\.)?)?youtu(?:be\.com\/watch\?v=|\.be\/|be\.com\/shorts\/)([\w\-\_]*)(?:\?t=(\d+))?\b/i);

                    if( !m )
                    {
                        m = row.log.match(/(?:https?:\/\/www\.)?instagram\.com\S*?\/p\/(\w{11})\/?/);

                        if(!m)
                        {
                            return false;
                        }
                    }

                    return { 
                        user: extractUserDataFromRow (row),
                        when: row.ultima_modificacion.toUTCString(),
                        posted: dateASYMD( row.fecha_del_log, true ) ,
                        logid: row.logid,
                        link: m[0]
                    }
                })
                .filter( itm=>itm!==false )
                
 
            
        },
    }
}