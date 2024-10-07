import { query } from '../../db/connection';
import { oauth_scopes } from '../scopes';

/**
 * Returns the basic data required by the OAuth screen that the users sees to grant access to the client's app.
 * 
 * @param {import('express').Request} req  
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 * @returns {void}
 */
export default async function getClientAppInfo(req, res, next) { 
        const cid = req.query.client;
        let row = await query("SELECT * FROM oauth_clients WHERE client_id=?",[ cid ]);
        if(!row.length)
        {
            res.status(404).json({ error: `Unknown client with id "${cid}"` });
            return;
        }
        
        res.json({
            name: row[0].app_name,
            url: row[0].app_url,
            availableScopes: oauth_scopes
        }) 
}