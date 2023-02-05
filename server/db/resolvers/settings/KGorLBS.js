import { query } from "../../connection.js";
import { OptionsSettingBase } from "./OptionsSettingBase.js";


const $options = ["Kilograms", "Pounds"] ;

export class KGorLBSSetting extends OptionsSettingBase {
    
    constructor() {
        super( $options, "uselbs","OptionSetting");
    } 

    __getOptionLabel( option ) {
        return option;
    }
 
    async __getSettingCurrentValue( userInfo ) 
    {
        return userInfo.usekg? 0 : 1; // 0 o 1
    }

    async __setValue(  userInfo, newValue )
    {  
        // porque en el UI el 1 representa "use Pounds"
        await query(`UPDATE users SET usekg=? WHERE id=?`, [ newValue==1? 0 : 1, userInfo.id ]); 
    } 

}