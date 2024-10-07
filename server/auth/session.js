import { Response, Request } from '@node-oauth/oauth2-server';
import { oauthServer } from './router';

/**
 * Returns the OAuth session info (if any) or NULL if no info or some error happened.
 *  
 * @param {import('express').Request} req   
 */
export const getOAuthSessionFromRequest = async req => {

    let hasAuth     = req.headers.authorization; 

    if(!hasAuth || hasAuth.split(" ")[1].indexOf(".")>-1 ) return;

    let res         = new Response();
    const request   = new Request(req); 

    try
    {
        var token = await oauthServer.server.authenticate(request, res);  
    }
    catch(e) 
    { 
        // return {
        //     error: e.name //`${e.code ?? "Error"} : ${e.message}!!!`
        // };
        throw e;
    }
 
    return {
        id: token.user.id, //<-- ID of a user in the weightxreps database.
        hasScope: scopeId => token.scope?.indexOf(scopeId)>-1
    }
    
};