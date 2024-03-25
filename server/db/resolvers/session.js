import { query } from "../connection.js";
import { extractTokenData, packAsToken } from "../../utils/token.js";
import extractUserDataFromRow from "../../utils/extractUserDataFromRow.js";
import md5 from "md5";
import { isEmail } from "./settings/EmailSetting.js";
import { getOfficialExercises } from "../../utils/ename2type.js";
import { sendEmailNow, sendEmail } from "../../utils/send-email.js";
import { sendWelcomeMessage } from "./inbox.js";
import { LoginWithGoogle } from "./session-login-google.js";
import { LoginWithFirebase } from "./session-login-firebase.js";
import { getInvalidUsernameError } from "../../utils/getInvalidUsernameError.js";
import { getForumRoleById} from "./forum.js";

const getSession = async (parent, args, context) => {

    if( context.session ) // si hay session data... { id, uname }
    {
        //es valid... buscar ese usuario en la database...
        const SID = context.session.id;

        let user = await query("SELECT * FROM users WHERE id=?", [SID]);
        return {
            user: extractUserDataFromRow( user[0] ),
            forum: {
                role: getForumRoleById( user[0].forumRole )?.toJs()
            },
        }
    }

    return null;
}

const login = async (parent, args, context) => {
 
    let u = args.u; 
    let p = args.p;

    //
    // fijarse en tabla users y "code_verification" que es donde se ponen los "temp" passwords en caso de que use el "forgot password"
    //
    let user = await query(`SELECT users.id, uname, pass, param AS tempPass 
                            FROM users 
                            LEFT JOIN code_verification AS temp ON temp.uid=users.id AND temp.setting_key='tmp-pass' 
                            WHERE uname=? OR email=?`, [ u, u ]); 

 
    if( user.length==0 )
    {
        if( u.indexOf("@")>0 )
        {
            throw new Error(`ERR:uname Email [${u}] not found.`);
        }
        else 
        {
            throw new Error(`ERR:uname Username [${u}] not found.`);
        }
        
    }

    //
    // ver si el "p" matchea el password o elguno de los temp passwords...
    //
    else if( !user.some( row=>row.pass==md5(p) || row.tempPass==p ) )
    { 
        throw new Error(`ERR:pass Incorrect password. If you forgot the email associated with your account (complete mental blackout), drop me an email to pablo@weightxreps.net and let's see if we can figure this out...`); 
    }

    //
    // delete temporal passwords if any...
    //
    await query(`DELETE FROM code_verification WHERE setting_key='tmp-pass' AND uid=?`, [user[0].id]);

 
    return packAsToken( {
        id      : user[0].id,
        uname   : user[0].uname
    } ); // id, uname
}


export const createSessionContext = req => {

    const token = (req.headers.authorization || '').split(" "); 
    let sessionData;

    if( token.length==2 )
    {
        sessionData = extractTokenData( token[1] );  

        
        if( process.env.NODE_ENV === 'development' )
        {
            //TODO fake session id
            sessionData = { id:12, uname:"...",usekg:1 };
        }
        
    } 

    return { session: sessionData };
}

 

const signup = async (parent, args, context) => {

        const setError = (e)=>{
            throw new Error(`ERR:${e.id} ${e.error}`);
        }

        //#region BUILD PAYLOAD
        //
        // validate username
        //
        const uname = args.uname.trim();
        const unameError = getInvalidUsernameError(uname);

        /*
        if( uname.length=="")
        {
            return setError({ id:"uname", error:"Type your desired username!"});
        }
        else if( !uname.match(/^[a-z0-9_]{4,80}$/) )
        {
            return setError({ id:"uname", error:"Invalid username, either too short (less than 2 chars) or too long (more than 80 chars)... Also, only letters, numbers and the underscore symbols are allowed."});
        } */
        if( unameError )
        {
            return setError({ id:"uname", error:unameError});
        }
        
        //
        // email...
        //
        const email = args.email.trim();

        if( !email.length )
        {
            return setError({ id:"email", error:"What's your email?"});
        }
        else if( !isEmail(email)) 
        {
            return setError({ id:"email", error:"Invalid email..."});
        }

        //
        // password
        //
        const pass = args.pass.trim();

        if( pass.length<6 )
        {
            return setError({ id:"pass", error:"Password must be AT LEAST 6 characters long..."});
        }
        //#endregion

        // check que no exista already...
        const check = await query(`SELECT uname, email FROM users WHERE deleted=0 AND (uname=? OR email=?) LIMIT 1`, [ uname, email ]);

        if( check.length )
        {
            if( check[0].uname.toLowerCase()==uname.toLowerCase() )
            {
                return setError({ id:"uname", error:"That username is already taken, pick another!" });
            }
            else if( check[0].email.toLowerCase()==email.toLowerCase() )
            {
                return setError({ id:"email", error:"That email is already in use, pick another!" });
            }
        }

        //
        // all good... add to pending....
        //
        const secretCode = md5( uname+pass+new Date().getTime().toString() ).substr(-6);

        const result = await query(`INSERT INTO signup_users SET ?`, {
            uname, 
            pass: md5(pass), 
            email, 
            isFemale:args.isf==1? 1 : 0, 
            usekg:args.usekg==1?1:0,
            fecha: new Date(),
            code: secretCode
        });

        if( result.affectedRows )
        {

            await sendEmailNow(email, "Signup Code: "+secretCode, "You recently signed up to create an account on weightxreps.net, the signup form will ask you for a code. This is the code you must copy & paste: <br/><h1><strong>"+secretCode+"</strong></h1>");

            return true; //esperando código....
        }
        else 
        {
            throw new Error("Unexpected error, failed to create account... try again...");
        }
}

const verifySignup = async (parent, args, context) => {
    const code = args.code;

    if( code.length<6 ) 
    {
        throw new Error("ERR:code Code must be 6 characters long!");
    }

    const pending = await query(`SELECT * FROM signup_users WHERE code=? LIMIT 1`, [code]);

    if( pending.length==0 )
    {
        throw new Error("ERR:code Invalid code!");
    }

    //
    // crear usuario!
    //
    const signupData = pending[0];
    const op = await query(`INSERT INTO users SET ?`, {
        deleted:0,
        email: signupData.email,
        uname: signupData.uname,
        supporterLevel: 0,
        days_left_as_supporter: 0,
        isFemale: signupData.isFemale,
        joined: signupData.fecha,
        rank:0, 
        pass: signupData.pass,
        usekg: signupData.usekg,
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
        // delete temp data
        //
        await query(`DELETE FROM signup_users WHERE id=?`, [signupData.id]);

        //
        // mensaje de bienvenida...
        //
        await sendWelcomeMessage( op.insertId );


        //success!!!!
        //
        return packAsToken( { id: op.insertId, uname: signupData.uname  } ); // id, uname
    }

    throw new Error("Unexpected failure to create account... try again...");
}


/**
 * Crea un password "temporal" en code_verification
 * Se debería borrar al usarla...
 */
const forgot = async (parent, args, context) => {

    const uore = args.uore; // uname or email...
    const urow = await query(`SELECT id, email FROM users WHERE uname=? OR email=? LIMIT 1`, [uore, uore]);

    if( urow.length==0 )
    {
        throw new Error("ERR:uore Can't find any account with that username or email... check the spelling...");
    }

    if( urow[0].email=="" )
    {
        throw new Error("Your account doesn't have an email associated with it so we can't send you a recovery link :( (Mabe you used the \"sign in with phone\" option? try that...)");
    }


    const enames = getOfficialExercises();
    const word1 = enames[ Math.floor( Math.random()*enames.length ) ].variants[0];
    const word2 = Math.floor( 100+200*Math.random() ); // el "peso"
    const word3 = Math.random()>.5? "kg" : "lbs";

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        } 

        return arr;
    }

    const tempPassword  = shuffleArray([ word1, word2, word3 ]).join(" "); 

    const res           = await query(`INSERT INTO code_verification SET ?`, {
        setting_key     :"tmp-pass",
        uid             : urow[0].id,
        param           : tempPassword,
        code            : 0 //no se usa...
    });


    if( res.affectedRows==1 )
    {

        //
        await sendEmail(urow[0].id, "Temporary password!", "You recently forgot your password and requested a reminder. A new temporary password was created so you can login again. <br/>This is the new password: <br/><h6><strong>"+tempPassword+"</strong></h6>");
        //

        return true;
    }

    throw new Error("Unexpected error..."); 
}



export const SessionResolvers = {
    Query: { 
         getSession 
    },

    Mutation: {
        login, 
        signup,
        verifySignup,
        forgot,
        loginWithGoogle: LoginWithGoogle,
        loginWithFirebase: LoginWithFirebase
    }
}