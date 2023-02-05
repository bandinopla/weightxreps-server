import { OAuth2Client } from "google-auth-library";
import { getInvalidUsernameError } from "../../utils/getInvalidUsernameError.js";
import { packAsToken } from "../../utils/token.js";
import { query } from "../connection.js";
import { sendWelcomeMessage } from "./inbox.js"; 
import config from "../../config.js";

//https://console.cloud.google.com/apis/credentials/oauthclient
const CLIENT_ID         = config.googleClientID;  


/**
 * YA NO SE USA!!!!
 */
export const LoginWithGoogle = async (parent, args, context) =>
{ 
    const client        = new OAuth2Client(CLIENT_ID); 

    try 
    {
        var ticket = await client.verifyIdToken({
            idToken: args.jwt,
            audience: CLIENT_ID,    // Specify the CLIENT_ID of the app that accesses the backend
                                    // Or, if multiple clients access the backend:
                                    // [CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
    }
    catch(err)
    { 
        throw new Error("Failed to verify Google's session token..." ); 
    }
 


    const payload           = ticket.getPayload();
    const userid            = payload['sub'];
    const email             = payload["email"];
    const email_verified    = payload["email_verified"]; 

    /**
     * payload.sub : ID del usuario...
     * payload.email
     * payload.email_verified : Boolean
     * payload.name
     */
     const exists = await query(`SELECT id, uname FROM users WHERE email=? LIMIT 1`, [ email ]);

     if( exists.length )
     {
         // hacerle login
         return packAsToken( {
            id      : exists[0].id,
            uname   : exists[0].uname
        } ); // id, uname
     }
     else 
     {
        if( !args.uname )
        {
            throw new Error("PICK-UNAME");
        }

        const unameError = getInvalidUsernameError(args.uname);

        if( unameError )
        { 
            throw new Error(`PICK-UNAME|Username "${args.uname}" has this error: ${unameError}`);
        }  

        const unameOK = await query(`SELECT id FROM users WHERE uname=? LIMIT 1`, [ args.uname ]);

        if( unameOK.length )
        {
            throw new Error(`PICK-UNAME|Username "${args.uname}" is already taken! Pick another...`);
        }

        // todo ok!!! crearlo....
        return await doSignup({ email, ...args });
     } 
}



const doSignup = async ({ uname, isf, usekg, email }) => {

    const op = await query(`INSERT INTO users SET ?`, {
        deleted:0,
        email ,
        uname ,
        supporterLevel: 0,
        days_left_as_supporter: 0,
        isFemale: isf==1?1:0,
        joined: new Date(),
        rank:0, 
        pass: "",
        usekg: usekg==1?1:0,
        bw:0,
        hidebw: 0,
        private: 0,
        custom1RM: 0,
        availableDownloads: 0,
        blockedusers: ""
    });

    //
    // cool!
    //
    if( op.affectedRows )
    {  
        //
        // mensaje de bienvenida...
        //
        await sendWelcomeMessage( op.insertId );


        //success!!!!
        //
        return packAsToken( { id: op.insertId, uname  } ); // id, uname
    }

}