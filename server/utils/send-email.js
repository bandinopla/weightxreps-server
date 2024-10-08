import config from "../config.js"; 
import nodemailer from "nodemailer";
import { query } from "../db/connection.js"; 


/**
 * This "transport" is used when no user is set in the enviromental variable NOTIFICATIONS_EMAIL
 * Intended to be used when developing so no email is sent...
 */
const __emptyTransport = {
    sendMail: async (info)=>{

        if( process.env.VERBOSE==="true" )
        {
            console.log("\n\n------- SENDING FAKE EMAIL -----");
            console.log( JSON.stringify( info, null, 4) );
            console.log("-------------------------------------------------------\n\n");
        }
        

        return {
            accepted: [true]
        }
    }
}

var $transport = !config.mailer_auth_credentials.user? __emptyTransport : null;
 
async function getTransport() {

    if( $transport ) return $transport;
 
    // create reusable transporter object using the default SMTP transport
    $transport = nodemailer.createTransport({
      host: "weightxreps.net",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        ...config.mailer_auth_credentials
      },
    }); 
    
    return $transport;
}


/**
 * 
 * @param {string} to -EMAIL
 * @param {string} subject 
 * @param {string} message 
 */
export const sendEmailNow = async ( to, subject, message )=>{

    const transport = await getTransport();

    try{
        var info = await transport.sendMail({
            from: '"Weightxreps.net Notification" <notifications@weightxreps.net>', // sender address
            to ,   
            replyTo: "pablo@weightxreps.net",
            subject, // Subject line 
            html: message.trim(), // html body
          });
    }
    catch(e)
    {
        //console.log("ERROR:", e)
    }
     
    return info;
}

/**   
 * @param {number|number[]} touid ID of the user/s to send the email to...
 * @param {string} subject 
 * @param {string|(to:number)=>string} message 
 * @param {string} optionalEmail Email to be used in case target has no registered email in DB and target is only 1 user. 
 */
export const sendEmail = async ( touid, subject, message, optionalEmail ) => {

    // primero intentar enviar el mensaje...
    const tos = Array.isArray(touid)? touid : [touid];

    //
    // obtain the emails of targets and also check if they allow emails.
    //
    let emails = await query(`SELECT A.id, A.email, B.email AS allowsEmails
                                FROM users AS A 
                                LEFT JOIN users_notifications_settings AS B ON B.uid=A.id
                                
                                WHERE A.id IN (?)`, [ tos ]) 
                                ;

    //
    // if we are sending to just 1 target but it has no email... use the optionalEmail or fail.
    //
    if( tos.length==1 && !emails[0]?.email  )
    {
        if( optionalEmail )
        {
            emails = [{ id:touid, email:optionalEmail, allowsEmails:1 }]
        }
        else 
        {
            throw new Error("NOEMAIL");
        } 
    } 

    if( emails.length )
    { 
        return await Promise.all( 
                                    emails
                                          // only if allows emails
                                          .filter( row=>row.allowsEmails!==0 ) 

                                          //send...
                                          .map( row=>sendEmailNow( row.email, 
                                                                    subject, 
                                                                    typeof message == 'function' ? message(row.id) : message
                                                                    ))
        );
    }

    throw new Error("Twilight Zone Error... referenced user/s not found...");
} 