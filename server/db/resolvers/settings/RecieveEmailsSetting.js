import { query } from "../../connection.js";
import { OptionsSettingBase } from "./OptionsSettingBase.js";


const $options = ["Don't send me emails", "Send me emails"] ;

export class RecieveEmailsSetting extends OptionsSettingBase {
    
    constructor() {
        super( $options, "emails-allowed","OptionSetting");
    } 

    __getOptionLabel( option ) {
        return option;
    }
 
    async __getSettingCurrentValue( userInfo ) 
    {
        const res = await query(`SELECT email FROM users_notifications_settings WHERE uid=?`, [ userInfo.id ]);

        return res?.[0]?.email !== 0 ? 1 : 0; 
    }

    async __setValue(  userInfo, newValue )
    {  
        return await query(`INSERT INTO users_notifications_settings (uid, email)
                                    VALUES (?,?)
                                    ON DUPLICATE KEY UPDATE email = ?;
                                    `, [ userInfo.id, newValue, newValue ]); 
    } 

}