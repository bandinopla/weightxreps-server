import oauthServer from "../server"; 

/** 
 * @param {import('express').Request} req  
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 * @returns {void}
 */
async function authorize(req, res, next) {  

        if(!req.session?.id) //<-- set by the `sessionMiddleware`
        {
            res.status(401).json({ error:"You must be logged in!"});
            return;
        }  
        
        next() ;
}

export default [
    authorize,
    oauthServer.authorize({  
        authenticateHandler: {
            handle: req => { 
                return req.session //<-- set by the `sessionMiddleware`
            }
        },
        
    })
]