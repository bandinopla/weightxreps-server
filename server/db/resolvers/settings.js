import streamToPromise from 'stream-to-promise';
import fs from 'fs';
import $config from "../../config.js";
import { query } from '../connection.js';
import { EmailSetting } from './settings/EmailSetting.js';
import { PasswordSetting } from './settings/PasswordSetting.js';
import { DOBSetting } from './settings/DOB.js';
import { CountryCodeSetting } from './settings/CountryCodeSetting.js';
import { GenderSetting } from './settings/GenderSetting.js';
import { PrivateModeSetting } from './settings/PrivateMode.js';
import { KGorLBSSetting } from './settings/KGorLBS.js';
import { HideBwSetting } from './settings/HideBWSetting.js';
import { SupporterLevelInfo } from './settings/SupporterLevelInfo.js';
import { Custom1RMSetting } from './settings/Custom1RMSetting.js';
import { RPESetting } from './settings/RPESetting.js';
import { DeleteAccountSetting } from './settings/DeleteAccountSetting.js';
import { BlockUsersSetting } from './settings/BlockUsersSetting.js';
import md5 from 'md5';
import { sendNotification } from '../../utils/send-email.js';
import { ChangeUsernameSetting } from './settings/ChangeUsernameSetting.js';
import { SocialMediaSetting } from './settings/SocialMediaSetting.js';
 

const $settings = [
    new EmailSetting(),
    new PasswordSetting(),
    new DOBSetting(),
    new CountryCodeSetting(),
    new GenderSetting(),
    new PrivateModeSetting(),
    new KGorLBSSetting(),
    new HideBwSetting(),
    new SupporterLevelInfo(),
    new Custom1RMSetting(),
    new RPESetting(),
    new DeleteAccountSetting(),
    new BlockUsersSetting(),
    new ChangeUsernameSetting(),
    new SocialMediaSetting()
]

export const SettingsResolver = {  

    Query: {

        getUserSettings: async (parent, args, context) => {
            const user          = context.userInfo;
            const pendingCodes  = await query(`SELECT * FROM code_verification WHERE uid=?`, [ user.id ]);

            const rtrn = [];

            for (let i = 0; i < $settings.length; i++) 
            {
                const setting = $settings[i];

                var settingValue = await setting.getSetting(user, true);

                rtrn.push({
                    ...settingValue,
                    waitingCodeToChange: pendingCodes.find(row=>row.uid==user.id && row.setting_key==setting.id) != null
                });
            }

            return rtrn;
        } 

    },

    Mutation: {
        uploadAvatar: async (parent, { file }, context) => {
            const myid = context.session.id;
            const { createReadStream, filename, mimetype, encoding } = await file;

            // Invoking the `createReadStream` will return a Readable Stream.
            // See https://nodejs.org/api/stream.html#stream_readable_streams
            const stream = createReadStream();
            
            // This is purely for demonstration purposes and will overwrite the
            // local-file-output.txt in the current working directory on EACH upload.
            const out = fs.createWriteStream( $config.avatarUploadUrl +"u_"+myid+'.jpg');
            stream.pipe(out);
            await streamToPromise(out);

            //console.log("AVATAR UPLOADED!")
            //console.log( { filename, mimetype, encoding } );

            return new Date().getTime().toString(); //<<---- hash para que haga update...
        },

        setSetting: async (parent, args, context) => {

            const user          = context.userInfo; 
            const setting       = $settings.find(s=>s.id==args.id);
  

            if( setting )
            { 
                
                // puede tirar error...
                const value = await setting.input2value( args.value, user ); 


                //await setting.setValue( user, args.value )
                if( setting.mustBeVerified )
                {   
                    const secretCode =  md5( user.id+new Date().getTime().toString() ).substr(-6);

                    const v = await query(`INSERT INTO code_verification SET ?`, {
                        code        : secretCode,
                        param       : JSON.stringify( value ),
                        setting_key : setting.id,
                        uid         : user.id
                    });

                    if( v.affectedRows==1 )
                    {

                        //
                        try
                        {
                            await sendNotification( user.id, 
                                                    "Verification Code: "+secretCode, 
                                                    "You recently changed a setting in your account that requires a code verification. This is the code you must copy & paste: <br/><h1><strong>"+secretCode+"</strong></h1>",
                                                    
                                                    //
                                                    // usar este email si no tiene uno el usuario.
                                                    //
                                                    setting.id=="email"? value : null
                                                    );
                        }
                        catch(e)
                        {
                            if( e.message=="NOEMAIL" )
                            { 
                                throw new Error("You must set your account's EMAIL first! Since this action requires email confirmation.");
                            }
                            else 
                            {
                                throw e;
                            }
                        }

                        
                        return setting.asPending();
                    }
                    else 
                    {
                        throw new Error("Failed to set the setting for an unexpected reason...");
                    }
                }
                else 
                { 
                    return await setting.setValue( user, value );
                }
            }

            throw new Error(`Unknown setting [${args.id}]`);
 
        },


        /**
         * Si el `args.code` viene con un "!" adelante, se considera que se quiere "cancelar" el estado de "waiting for code"
         */
        sendVerificationCode: async (parent, args, context) => {

            const uid           = context.session.id;
            const userInfo      = context.userInfo;
            const settingID     = args.id;
            const setting       = $settings.find(s=>s.id==settingID);
            var code            = args.code;
            var deleteMode      = false;

            //
            // el setting ID es valido?
            //
            if( !setting )
            {
                throw new Error("You are trying to access an unknown setting ["+settingID+"]");
            }

            //
            // obtener code-verification row
            //
            const row           = await query(`SELECT id, code, param FROM code_verification WHERE uid=? AND setting_key=? ORDER BY id DESC LIMIT 1`, [ uid, settingID ]);

            if( !row || !row.length )
            {
                //throw new Error("The setting is not expecting a verification code. (try refreshing the page)");
                return await setting.getSetting( userInfo );
            }

            //
            // cancel mode?
            //
            if( code.substr(0,1)=="!" )
            {
                deleteMode  = true;
                //code        = code.substr(1);
            }

            //
            // Activar setting...
            // 
            else if( row[0].code!=code )
            {
                throw new Error("Wrong code. Doesn't match the one expected.");
            }

            //
            // código usado. Borrarlo... borramos todos los code verif de este usuario para ese setting (para evitar duplicados)
            //
            await query(`DELETE FROM code_verification WHERE setting_key=? AND uid=?`, [ setting.id, uid ]);

            //
            // cancel code...
            //
            if( deleteMode )
            { 
                return await setting.getSetting( userInfo );
            }
            else 
            {
                var newValue = JSON.parse( row[0].param );

                return await setting.setValue( userInfo, newValue );
            }  
            
        } 
    }
}