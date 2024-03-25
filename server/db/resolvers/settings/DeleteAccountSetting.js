import { query } from "../../connection.js";
import { BaseSetting } from "./BaseSetting.js";


const $deleteAccountSignature = "delete my account no way back";

export class DeleteAccountSetting extends BaseSetting {

    constructor()
    {
        super("del-acc", "DeleteAccountSetting", true) 
    } 

    input2value(v) {

        if( v!=$deleteAccountSignature )
        {
            throw new Error("Invalid confirmation text.");
        }

        return v;
    } 

    async getSetting( userInfo ) {  
        return this.__asSetting({
            signature: $deleteAccountSignature
        });
    }

    async setValue( userInfo, newValue )
    {  
        // donations_history uid
      
        // messages uid  
        // message_to  touid  
        // users id  

        const quickDeletes = [
            ["device_usage","uid"],
            ["email_send_queue","touid"],
            ["erows","uid"],
            ["exercises", "uid"],
            ["follow", "followerid"],
            ["follow", "followingid"],
            ["follow_counter_cache", "uid"],
            ["likes_history","uid"],
            ["logs","uid"],
            ["messages_unread_cache","uid"],
            ["rpe_override","uid"],
            ["users_forgot","uid"],
            ["users_google","uid"],
            ["users_notifications_settings","uid"],
            ["users_prs","uid"],
            ["tags","uid"],
            ["tags_used","uid"]
        ];

        for (let i = 0; i < quickDeletes.length; i++) 
        {
            const delRef = quickDeletes[i];
            await query(`DELETE FROM ${delRef[0]} WHERE ${delRef[1]}=?`, [userInfo.id])
        }

        //
        // "empty" user data
        //
        await query(`UPDATE users SET ? WHERE id=?`, [ { 
            uname:"[deleted]"+userInfo.uname,
            deleted: 1,
            email:"",
            pass:"",
            bday:null, 
            country_code:null,
            last_log:null,
            idOfLastLog:null,
            blockedusers:"" 
        }, userInfo.id  ]);


        //
        // messages... solo borramos el texto del mensaje.
        //
        await query( `UPDATE messages SET message="" WHERE uid=?`, [userInfo.id] );

        //
        // forum messages
        //
        await query( `UPDATE forum SET post_comment="" WHERE uid=?`, [userInfo.id] );

        /**
         * en inbox, si no se encuentra el "journal" en el left join pero hay logid, asumir que el journal se borro, no devolver esos items!
         */

        //
        // DONE! deleted!
        //
        return this.__asSetting({
            signature:"deleted"
        });
    } 
}