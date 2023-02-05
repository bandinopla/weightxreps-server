import { ymd2date } from "../../../utils/dateASYMD.js";
import { query } from "../../connection.js";
import { BaseSetting } from "./BaseSetting.js";


export class DOBSetting extends BaseSetting {
    constructor() {
        super("dob","DOBSetting");
    } 

    input2value(v) 
    {
        let d           = ymd2date(v);
        let today       = new Date(); 
        const age       = Math.floor( (today.valueOf()-d.valueOf()) / 31557600000 );

        if( age < 1 )
        {
            throw new Error("WOW! A visitor from the future! cool! But sorry, we can't handle your futuristic date... :/");
        }
        else if( age<13 )
        {
            throw new Error("Too young! sorry...");
        }
        else if( age>100 )
        {
            throw new Error("No way you are older than 100 y/o... come on...");
        }

        return v;
    }

    async getSetting( userInfo ) {
 
        return this.__asSetting({  
            dob: userInfo.bday
        });
    }

    async setValue( userInfo, newValue )
    {  
        const res = await query(`UPDATE users SET bday=? WHERE id=?`, [ newValue, userInfo.id ]);

        return this.__asSetting({
            dob: newValue
        });
    }

}