 
import config from "../config.js";

//----------------------------------------
import crypto from 'crypto';
 
const base64Encode  = str=>Buffer.from( str ).toString('base64');
const base64Decode  = str=>Buffer.from( str,"base64" ).toString();

//----------------------------------------

const sign = ( str, secret, offset ) => { 
    
    const d             = new Date();

    if( offset )
    {
        d.setTime( d.getTime() + offset ); 
    }

    //
    // encode the "month" in the passphrase so that we can make it "expire" in a way...
    //
    const passphrase    =  (secret || config.tokenSecret) + "|" + d.getFullYear() + "|" + d.getMonth() ; //<--  "expire" after a month
     
    return crypto   .createHmac("sha256", passphrase)
                    .update(str)
                    .digest("hex");
};


 
export const packAsToken = (obj, offset) => {
    let data        = base64Encode( JSON.stringify(obj) );
    let signature   = sign(data, null, offset);
    return `${data}.${signature}`
}
 

export const extractTokenData = token => {

    try 
    {
        var [encodedData]           = token.split("."); 
        var data                    = JSON.parse( base64Decode( encodedData ) );
    }
    catch(e)
    {
        return null;
    }
    

    const oneMonthInMs = 30 * 24 * 60 * 60 * 1000;


    //
    // token "expires" after 1 month... (login will be required once a month)
    // try with current date or 1 month back. This will mean that the token is in the 30 days range of validity before "expiration"
    //
    if( packAsToken(data)==token || packAsToken(data, -oneMonthInMs)==token ) 
    { 
        return data;
    }

    return null;
}
 
