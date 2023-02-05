import { query } from "../../connection.js";
import { BaseSetting } from "./BaseSetting.js";


export const isEmail = v => v.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)!=null;

export class EmailSetting extends BaseSetting {

    constructor()
    {
        super("email", "EmailSetting", true) 
    } 

    input2value(v) {

        if( !isEmail(v) )
        {
            throw new Error("Invalid email format");
        }

        return v;
    }

    async getSetting( userInfo ) {

        const urow = await query(`SELECT email FROM users WHERE id=?`, [ userInfo.id ]);

        return this.__asSetting({  
            currentEmail: urow[0].email
        });
    }

    async setValue( userInfo, newValue )
    { 
        const res = await query(`UPDATE users SET email=? WHERE id=?`, [ newValue, userInfo.id ]);

        return this.__asSetting({  
            currentEmail: newValue
        });
    }

    asPending() {
        return super.asPending({
            currentEmail:"..."
        });
    }
}