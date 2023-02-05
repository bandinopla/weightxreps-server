

import { query } from "../../connection.js";
import { BaseSetting } from "./BaseSetting.js";
import { ORIGINAL_1RM_FACTOR, JS_1RM_FORMULA } from "../exercises.js";


export class Custom1RMSetting extends BaseSetting {

    constructor() {
        super("custom1rm","Custom1RMFactorSetting");
    }

    async getSetting( userInfo ) {  
        return this.__asSetting({
            factor: userInfo.custom1RM,
            formula: JS_1RM_FORMULA,
            default: ORIGINAL_1RM_FACTOR
        });
    }

    input2value(v) 
    {
        const f = Number(v);

        if( isNaN(f)) {
            throw new Error("Invalid factor, must be a number!");
        }

        if( f!=Math.round(f) )
        {
            throw new Error("Must be a round number, not a fraction!");
        }

        if( f>10000 )
        {
            throw new Error("Factor is too big! Unnecesary...")
        }

        if( f<0 )
        {
            throw new Error("Must be a positive number!");
        }

        return v || ORIGINAL_1RM_FACTOR;
    }

    async setValue( userInfo, newValue )
    {   
        const res = await query(`UPDATE users SET custom1RM=? WHERE id=?`, [ newValue , userInfo.id ]);

        return await this.getSetting({
            custom1RM: newValue
        });
    }

}

