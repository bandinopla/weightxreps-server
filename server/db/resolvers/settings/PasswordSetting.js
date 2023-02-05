import { BaseSetting } from "./BaseSetting.js";
import { query } from "../../connection.js";
import md5 from "md5";


export class PasswordSetting extends BaseSetting{
    constructor() {
        super("password","VoidSetting", true);
    }

    input2value(v) {
        return md5(v);
    }

    async setValue( userInfo, newValue )
    {  
        const res = await query(`UPDATE users SET pass=? WHERE id=?`, [ newValue, userInfo.id ]);

        return this.__asSetting({});
    }
}