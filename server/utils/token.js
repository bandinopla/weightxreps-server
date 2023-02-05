/*

import {packAsToken,extractTokenData} from "./utils/token.js"

let token = packAsToken({ secreto:"muy oculto" });

console.log( "token = ",token );
console.log( "Decoded: ", extractTokenData(token) )

*/

//----------------------------------------

const xor           = ( a, b ) => a.split("").map( (l,i)=> String.fromCharCode( l.charCodeAt(0)^b.charCodeAt( i % b.length) ) ).join(""); 
const base64Encode  = str=>Buffer.from( str ).toString('base64');
const base64Decode  = str=>Buffer.from( str,"base64" ).toString();

//----------------------------------------

const sign = str => { 
    
    let B   = "secret";
    let C   = "pupu";
    let max = Math.max(str.length, B.length, C.length);
    let A   = str;

    A = A.padStart( max, "caca");
    B = B.padStart( max, "xaxa");
    C = C.padStart( max, "zzzz");

    //console.log( A, B, C) 

    let r;

    for (let i = 0; i < 3 ; i++) 
    {
        B = xor( B, A );
        C = xor( C, B );
        A = xor( A, C); 
    } 

    return base64Encode(B); 
};
 
export const packAsToken = obj => {
    let data        = base64Encode( JSON.stringify(obj) );
    let signature   = sign(data);
    return `${data}.${signature}`
}

export const extractTokenData = token => {

    try 
    {
        var parts       = token.split("."); 
        var data        = JSON.parse( base64Decode( parts[0] ) );
    }
    catch(e){
        return null;
    }
    

    if( packAsToken(data)==token ) {
        return data;
    }

    return null;
}
 
