import { query } from "../connection.js";
import extractUserDataFromRow from "../../utils/extractUserDataFromRow.js";
import { getCached } from "../../utils/cache.js";
import { dateASYMD } from "../../utils/dateASYMD.js";

export const VideosResolver = {  
    Query: {
        getVideos: async (parent, args, context )=>{ 

            return await getCached("VIDEOS", 1000*60*15 ).or( async ()=>{
 
                // const results   = await query(`SELECT 

                //                             B.*,
                //                             A.fecha_del_log,
                //                             A.ultima_modificacion,
                //                             A.log,
                //                             A.id AS logid
                                            
                //                             FROM users AS B
                //                             INNER JOIN logs AS A ON A.id=B.idOfLastLog
                //                             where 
                                            
                //                             B.deleted=0 AND B.private=0 AND
                //                             A.log LIKE '%youtube.com%' OR 
                //                             A.log LIKE '%youtu.be%' OR
                //                             A.log LIKE '%instagram.com%' 
                                            
                //                             ORDER BY B.idOfLastLog DESC LIMIT 50
                //                             `); //AND days > 0

                //const results = await query(`select A.ultima_modificacion, A.fecha_del_log, A.log, A.id AS logid, B.* from logs AS A INNER JOIN users AS B ON B.id=A.uid AND B.deleted=0 where A.log LIKE '%youtube.com%' OR A.log LIKE '%youtu.be%' OR A.log LIKE '%instagram.com%' GROUP BY uname order by id DESC  LIMIT 50`)
             
                const results = await query(`
                                SELECT users.*, logs.id as logid, logs.log, logs.ultima_modificacion, logs.fecha_del_log
                                    FROM logs

                                    JOIN (
                                        SELECT id, MAX(fecha_del_log) AS recent_date
                                        FROM logs
                                        WHERE log LIKE '%youtube.com%' OR log LIKE '%youtu.be%' OR log LIKE '%instagram.com%'
                                        GROUP BY uid
                                    ) AS recent ON logs.id = recent.id AND logs.fecha_del_log = recent.recent_date

                                    JOIN users ON users.id = logs.uid

                                    ORDER BY ultima_modificacion DESC

                                    LIMIT 50
                                    `);

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
                

            } ); 
            
        },
    }
}