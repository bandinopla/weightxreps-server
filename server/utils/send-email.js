import config from "../config.js"; 
import nodemailer from "nodemailer";
import { query } from "../db/connection.js"; 

var $transport = null;
 
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
            html: message, // html body
          });
    }
    catch(e)
    {
        console.log("ERROR:", e)
    }
     
    return info;
}

/** 
 * Intenta enviar el mensaje de una primero...
 * Y si falla, lo deja en el queue...
 * 
 * @param {number} touid ID of the user
 * @param {string} subject 
 * @param {string} message 
 */
export const sendNotification = async ( touid, subject, message, optionalEmail ) => {

    // primero intentar enviar el mensaje...
    var email = await query(`SELECT email FROM users WHERE id=?`, [touid]);

    if( email.length )
    {
        let to = email[0].email;

        if( to=="" ) //no tiene email
        { 
            if( optionalEmail ) //pero nos pasaron uno opcional
            {
                to = optionalEmail;
            }
            else 
            {
                throw new Error("NOEMAIL");
            } 
        }

        var sent = await sendEmailNow( to, subject, message );

        if( sent.accepted?.length>0 )
        {
            console.log("MAIL SENT!", to);
            //OK!
            return;
        }
        else 
        {
            throw new Error("Oops! Mail sender unexpectedly... try again :/");
        }
    }

    throw new Error("Twilight Zone Error... referenced user not found.")
 
} 