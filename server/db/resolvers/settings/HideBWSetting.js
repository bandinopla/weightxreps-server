import { query } from "../../connection.js";
import { OptionsSettingBase } from "./OptionsSettingBase.js";


const $options = ["Public Bodyweight", "Private Bodyweight"] ;

export class HideBwSetting extends OptionsSettingBase {
    
    constructor() {
        super( $options, "hidebw","OptionSetting");
    } 

    __getOptionLabel( option ) {
        return option;
    }
 
    async __getSettingCurrentValue( userInfo ) 
    {
        return userInfo.hidebw ; // 0 o 1
    }

    async __setValue(  userInfo, newValue )
    {  
        await query(`UPDATE users SET hidebw=? WHERE id=?`, [ newValue, userInfo.id ]); 
    } 

}