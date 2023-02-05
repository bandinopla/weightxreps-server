import { query } from "../../connection.js";
import { BaseSetting } from "./BaseSetting.js";



export class ChangeUsernameSetting extends BaseSetting {

    constructor()
    {
        super("username", "UsernameSetting", false) 
    } 

    async input2value( v, user ) {

        if( typeof v != "string" )
        {
            throw new Error("Invalid username");
        }

        if( v.length<4 || v.length>20 )
        {
            throw new Error("Username must be between 4 and 20");
        }

        if( v.match(/[^a-z0-9_]+/gi) )
        {
            throw new Error("Invalid characters detected. Only letters, numbers and underscore allowed.");
        }

        // ahora chequear que no exista...
        const urow = await query(`SELECT uname FROM users WHERE uname=? LIMIT 1`, [v]);

        if( urow.length )
        {
            throw new Error("Username \""+v+"\" is taken. Pick another.");
        }

        if( !user.sok )
        {
            throw new Error("Only Active Supporters can change their username. Make a donation to become one!");
        }

        return v;
    }

    async getSetting( userInfo ) { 

        return this.__asSetting({  
            uname: userInfo.uname
        });
    }

    async setValue( userInfo, newValue )
    { 
        const res = await query(`UPDATE users SET uname=? WHERE id=?`, [ newValue, userInfo.id ]);

        return this.__asSetting({  
            uname: newValue
        });
    }

    asPending() {
        return super.asPending({
            uname:"..."
        });
    }
}