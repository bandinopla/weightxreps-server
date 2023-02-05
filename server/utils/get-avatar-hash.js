import $config from "../config.js";
import fs from "fs";

export const getAvatarHash = uid => {

    // devolver el timestamp del a imagen del usuario...
    // $config.avatarUploadUrl + / uid
    // fs.statSync( file ).mtime
    // https://nodejs.org/docs/v0.4.12/api/fs.html#fs.statSync

    try 
    {
        return fs.statSync( $config.avatarUploadUrl+"u_"+uid+".jpg" ).mtime;
    }
    catch(e)
    {
        return "";
    }
    
}