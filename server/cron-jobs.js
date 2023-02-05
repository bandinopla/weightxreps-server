import { query } from "./db/connection.js";
import {insertMessage} from "./db/resolvers/inbox.js";



/**
 * Mantiene actualizado el valor de "days_left_as_supporter basado en la ultima donacion que hizo..."
 */
const UpdateDaysLeftAsSupporter = async () => {
    
    const sql = `UPDATE users 
                    LEFT JOIN (SELECT A.id, A.uname, SUM(-DATEDIFF( NOW(), DATE_ADD(B.fecha, INTERVAL B.donation*6 DAY) )) as DaysLeft 
                                FROM donations_history AS B 
                                LEFT JOIN users AS A ON B.uid=A.id WHERE DATEDIFF( NOW(), DATE_ADD(B.fecha, INTERVAL B.donation*6 DAY) )< 0 GROUP BY A.id ORDER BY B.fecha DESC) as X 
                                ON users.id=X.id   
                    SET users.days_left_as_supporter=IF(X.DaysLeft>0,X.DaysLeft , 0)`; 

    try 
    {
        await query( sql );  
    } 
    catch( e )
    {
        // ignore ....
    } 
    finally 
    {
        setTimeout( UpdateDaysLeftAsSupporter, 1000*60*60*24 );
    }

}

/**
 * happy bday
 */
const SendHappyBdayDMs = async ()=> {

    //buscar cumpleañeros...
    //const msg = "Happy Birthday detected! today is your special day! hope you enjoy it and celebrate the start of a brand new year ahead!";

    //por cada usuario...
        // fecha especial --> event type

    //el año actual es el clave.... y ver si ya mandamos o no la notificacion...
    ///eleccion usuarios con bday = dia actual. o Join date dia actual...

    /**
     * Devuelve si hay alguien que cumpla años
     */
    const sql = `SELECT 
                    users.id AS uid,
                    users.uname AS uname,
                    joined AS jdayDate,
                    users.bday AS bdayDate,

                    YEAR(NOW())*10000+ MONTH(users.bday)*100 + DAY(users.bday) AS bdayKey,
                    YEAR(NOW())*10000+ MONTH(joined)*100 + DAY(joined) AS jdayKey,
 
                    MONTH(users.bday)=MONTH(NOW()) AND DAY(users.bday)=DAY(NOW()) AS isBday,
                    MONTH(users.joined)=MONTH(NOW()) AND DAY(users.joined)=DAY(NOW()) AS isJDay,
                    event_notification.bday AS bdaySentKey,
                    event_notification.jday AS jdaySentKey,

                    TIMESTAMPDIFF(YEAR, users.joined, CURDATE()) AS AnniversaryYears

                    FROM users 
                    LEFT JOIN event_notification ON users.id=event_notification.uid

                    WHERE
                        ( MONTH(users.bday)=MONTH(NOW()) AND DAY(users.bday)=DAY(NOW()) )
                        OR
                        ( MONTH(users.joined)=MONTH(NOW()) AND DAY(users.joined)=DAY(NOW()) )

                    `;

    try 
    {
        let rows      = await query( sql );  
         

        while( rows.length )
        {
            const row       = rows.pop();   

            let bdayKey = row.bdaySentKey || 0;
            let jdayKey = row.jdaySentKey || 0;

            let somethingWasSent = false;

            if( row.isBday && row.bdaySentKey!=row.bdayKey )
            {
                bdayKey = row.bdayKey;

                //send bday
                await insertMessage( row.uid, {
                    uid:1,
                    subject:"Happy Birthday!!",
                    message: `Happy Birthday ${row.uname}! today is your special day! today the world was blessed with your existence! hope you enjoy it and celebrate the start of a brand new year ahead!`
                }); 

                somethingWasSent = true;
            }

            if( row.isJDay && row.jdaySentKey!=row.jdayKey && row.AnniversaryYears>0 )
            {
                jdayKey = row.jdayKey; 

                await insertMessage( row.uid, {
                    uid:1,
                    subject: `Happy ${row.AnniversaryYears} year Anniversary!`,
                    message: `Happy Anniversary ${row.uname}! As of today it's been ${row.AnniversaryYears} year${row.AnniversaryYears>1?"s":""} since you joined this site! Hope you are enjoying your stay and find it useful! Please don’t hesitate to contact me if you encounter any other issues!`
                });
 
                somethingWasSent = true;
            }

            // hay algo que enviar?
            if( somethingWasSent )
            { 
                //actualizar notifications array...
                await query(`INSERT INTO event_notification (uid, bday, jday) VALUES (?,?,?) 
                                ON DUPLICATE KEY UPDATE bday = ?, jday=?`, [ row.uid, bdayKey, jdayKey, bdayKey, jdayKey ]);  
            } 
        }

    } 
    catch( e )
    {
        // ignore ....
        //console.log( e )
        return;
    } 
    finally 
    {
        setTimeout( SendHappyBdayDMs, 1000*60*60*24 );
    }

}


export const StartCronJobs = () => {
    UpdateDaysLeftAsSupporter();
    SendHappyBdayDMs();
}