import { query } from "../../connection.js";
import { BaseSetting } from "./BaseSetting.js";


export class BlockUsersSetting extends BaseSetting {

    constructor()
    {
        super("block", "BlockUsersSetting") 
    } 

    input2value(v) {

        if( !Array.isArray(v) )
        {
            throw new Error("Invalid value...");
        }

        // 50chars max...
        const val = v.map( itm=>String(itm).trim() ).join(",").trim();

        if( val.length>500 )
        {
            throw new Error("Too many users to block, delete some...");
        }

        return val; // awway de usernames...
    }

    __string2array(v) {
        return v.trim().split(",").map(v=>String(v));
    }

    async getSetting( userInfo ) {

        const urow = await query(`SELECT blockedusers FROM users WHERE id=?`, [ userInfo.id ]);

        return this.__asSetting({  
            unames: this.__string2array( urow[0].blockedusers ) //.trim().split(",").map(v=>v.string())
        });
    }

    async setValue( userInfo, newValue )
    { 

        const res = await query(`UPDATE users SET blockedusers=? WHERE id=?`, [ newValue.join(","), userInfo.id ]);

        return this.__asSetting({  
            unames: newValue
        });
    } 
}