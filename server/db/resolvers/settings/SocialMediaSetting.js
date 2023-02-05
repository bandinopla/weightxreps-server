import { BaseSetting } from "./BaseSetting.js";
import { query, transaction } from "../../connection.js";


const stringIsAValidUrl = (s) => {
    try {
      new URL(s);
      return true;
    } catch (err) {
      return false;
    }
  };


export class SocialMediaSetting extends BaseSetting{
    constructor() {
        super("socialmedia","SocialMediasSetting", false);
    }


    async getSetting( userInfo ) {

        const links = (await query(`SELECT url FROM \`social-links\` WHERE uid=? ORDER BY id ASC`, [userInfo.id]))
                            .map( r=>r.url )

        return this.__asSetting({ links });
    }


    input2value(v) { //<-- texto donde cada linea debe ser una url...
        if( typeof v!=='string' )
        {
            throw new Error("Invalid value...");
        }

        const str   = v.split("\n");
        const urls  = [];

        for (let i = 0; i < str.length; i++) {
            const url = str[i].trim();

            if( url=="" ) continue;

            if( !stringIsAValidUrl(url) )
            {
                throw new Error(`Link on line #${i+1} is not a valid URL.`);
            } 

            urls.push(url);
        } 

        return urls;
    }

    async setValue( userInfo, newValue )
    {  
        const tran      = await transaction(); 

        try 
        {
            await tran.query(`DELETE FROM \`social-links\` WHERE uid=?`, [ userInfo.id ]);

            if( newValue.length )
            {
                await tran.query(`INSERT INTO \`social-links\` (uid, url) VALUES ?`, [ newValue.map(url=>[userInfo.id, url]) ] );
            }

            //
            // all done!
            //
            await tran.commit(); 
            
        }
        catch(e )
        {
            console.log( "VAL = ", newValue)
            await tran.abort( "Aborted: "+String(e) );
        }


        return this.__asSetting({
            links:newValue
        });
    }
}