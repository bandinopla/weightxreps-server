import { query } from "../../connection.js";
import { OptionsSettingBase } from "./OptionsSettingBase.js";


const $options = ["public", "private"] ;

export class PrivateModeSetting extends OptionsSettingBase {
    
    constructor() {
        super( $options, "private","OptionSetting");
    } 

    __getOptionLabel( option ) {
        return option;
    }
 
    async __getSettingCurrentValue( userInfo ) 
    {
        return userInfo.private; // 0 o 1
    }

    async __setValue(  userInfo, newValue )
    {
        if( userInfo.sok==0 && newValue==1 )
        {
            throw new Error("You must be an ACTIVE supporter to turn on this feature ON. \"Active\" as in: you did a donation recently. \"Donation\" as in: monetary support of any amount, from 1u$d up to a million or even a billion dollars.  ");
        }

        await query(`UPDATE users SET private=? WHERE id=?`, [ newValue, userInfo.id ]); 
    } 

}