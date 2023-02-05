import { query } from "../../connection.js";
import { OptionsSettingBase } from "./OptionsSettingBase.js";


const $options = ["Male", "Female"] ;

export class GenderSetting extends OptionsSettingBase {
    constructor() {
        super( $options, "gender","OptionSetting");
    } 

    __getOptionLabel( option ) {
        return option;
    }
 
    async __getSettingCurrentValue( userInfo ) 
    {
        return userInfo.isf; // 0 o 1
    }

    async __setValue( userInfo, newValue )
    { 
        await query(`UPDATE users SET isFemale=? WHERE id=?`, [ newValue, userInfo.id ]);
    }  

}