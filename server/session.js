

import { getOAuthSessionFromRequest } from "./auth/session";
import { getWxrUserFromRequestToken } from "./db/resolvers/session";

 

export const sessionMiddleware = async (req, res, next) => {
 
    // will contain { id, uname } if a token exists...
    req.session = getWxrUserFromRequestToken(req);
   
    try
    {
        req.oauthSession = await getOAuthSessionFromRequest(req);
    }
    catch(e) {
 
        res.status(e.code).json({ error:e.name } );
        return;
    }
    
 
    next();
  };