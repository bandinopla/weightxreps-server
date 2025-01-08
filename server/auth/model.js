// See https://oauth2-server.readthedocs.io/en/latest/model/spec.html for what you can do with this
const crypto = require('crypto')
const { query:sqlQuery, transaction } = require('../db/connection');
const { default: isValidUrl } = require('../utils/isValidUrl');
var query = sqlQuery;

/**
 * @typedef {import("../db/schema/types").DeveloperService} DeveloperService
 */

const model = {

  getClient: async function (clientId, ___clientSecret___) {
    // query db for details with client
    let res = await query("SELECT * FROM oauth_clients WHERE client_id=?", [clientId]);

    if (!res.length) {
      throw new Error(`Client [${clientId}] not found...`);
    }

    let { client_id, redirect_uri } = res[0];

    log({
      title: 'Get Client',
      parameters: [
        { name: 'clientId', value: client_id },
        //{ name: 'clientSecret', value: ___clientSecret___ },
      ]
    });

    return {
      id: client_id,
      grants: ['authorization_code', 'refresh_token'],
      redirectUris: redirect_uri.split(","), //valid URIs to which this client can redirect to.
    } 

  },

  saveToken: async (token, client, user) => {
    /* This is where you insert the token into the database */
    log({
      title: 'Save Token',
      parameters: [
        { name: 'token', value: token },
        { name: 'client', value: client },
        { name: 'user', value: user },
      ],
    })

    let res = await query("INSERT INTO oauth_access_tokens SET ?", {
      refresh_token: token.refreshToken,
      refresh_expires_at: token.refreshTokenExpiresAt,
      access_token: token.accessToken,
      access_expires_at: token.accessTokenExpiresAt,
      client_id: client.id,
      user_id: user.id,
      scope: token.scope.join(",")
    });

    if ( res.affectedRows != 1 ) {
      throw new Error("Unexpected result after attempting to save token in the database...");
    } 

    return {
      ...token,
      client,
      user
    }

  },

  getAccessToken: async token => {
    /* This is where you select the token from the database where the code matches */
    log({
      title: 'Get Access Token',
      parameters: [
        { name: 'token', value: token },
      ]
    })

    if (!token || token === 'undefined') return false

    let res = await query("SELECT * FROM oauth_access_tokens WHERE access_token=?", [token]);

    if (!res.length) return false;

    let row = res[0];

    return {
      accessToken: token,
      accessTokenExpiresAt: row.access_expires_at,
      scope: row.scope.split(","),
      client: { id: row.client_id },
      user: {
        id: row.user_id
      }
    }

  },

  getRefreshToken: async token => {
    /* Retrieves the token from the database */
    log({
      title: 'Get Refresh Token',
      parameters: [
        { name: 'token', value: token },
      ],
    })
    
    let res = await query("SELECT * FROM oauth_access_tokens WHERE refresh_token=?", [token]);

    if (!res.length) {
      throw new Error("Refresh token not found for: " + token);
    }

    let row = res[0];

    return {
      refreshToken: row.refresh_token,
      refreshTokenExpiresAt: row.refresh_expires_at,
      scope: row.scope.split(","),
      client: { id: row.client_id },
      user: { id: row.user_id }
    }

  },

  revokeToken: async token => {
    /* Delete the token from the database */
    log({
      title: 'Revoke Token',
      parameters: [
        { name: 'token', value: token },
      ]
    })
    if (!token || token === 'undefined') return false

    let res = await query("DELETE FROM oauth_access_tokens WHERE refresh_token=?", [token.refreshToken]);

    return res.affectedRows > 0;
  }, 

  saveAuthorizationCode: async (code, client, user) => {
    /* This is where you store the access code data into the database */

    log({
      title: 'Save Authorization Code',
      parameters: [
        { name: 'code', value: code },
        { name: 'client', value: client },
        { name: 'user', value: user },
      ],
    });

    let res = await query("INSERT INTO oauth_authorization_token SET ?", {
      token: code.authorizationCode,
      expires_at: code.expiresAt,
      client_id: client.id,
      user_id: user.id, //ID del user...
      code_challenge: code.codeChallenge,
      code_challenge_method: code.codeChallengeMethod,
      scope: code.scope.join(","),
      redirect_uri: code.redirectUri
    });

    if(res.affectedRows!=1) {
      throw new Error("Unexpected result after trying to save authorization code...");
    }
 
    return { ...code, user } 
  },

  getAuthorizationCode: async authorizationCode => {
    /* this is where we fetch the stored data from the code */
    log({
      title: 'Get Authorization code',
      parameters: [
        { name: 'authorizationCode', value: authorizationCode },
      ],
    }) 

    let res = await query(`SELECT * FROM oauth_authorization_token WHERE token=?`, [authorizationCode]);

    if ( !res.length ) {
      throw new Error("Invalid or expired authorization code.");
    }

    let row = res[0]; 

    return {
      code: authorizationCode,
      expiresAt: row.expires_at,
      //redirectUri: row.redirect_uri,
      scope: row.scope.split(","),
      codeChallenge: row.code_challenge,
      codeChallengeMethod: row.code_challenge_method,
      client: {
        id: row.client_id
      },
      user: {
        id: row.user_id
      }
    }

  },

  revokeAuthorizationCode: async authorizationCode => {
    /* This is where we delete codes */
    log({
      title: 'Revoke Authorization Code',
      parameters: [
        { name: 'authorizationCode', value: authorizationCode },
      ],
    })

    let res = await query("DELETE FROM oauth_authorization_token WHERE token=?", [authorizationCode.code]); 
  
    return res.affectedRows > 0; // Return true if code found and deleted, false otherwise
  },

  verifyScope: (token, scope) => {
    /* This is where we check to make sure the client has access to this scope */
    log({
      title: 'Verify Scope',
      parameters: [
        { name: 'token', value: token },
        { name: 'scope', value: scope },
      ],
    }) 

    const userHasAccess = scope.every(element => token.scope?.includes(element));
    return userHasAccess;
  },

  /**
   * Returns the clients connected with this user's account.
   * 
   * @param {number} uid User ID in weightxreps
   * @returns {Array<{ id:string, name:string, url:string }>}
   */
  getConnectedClientsTo: async uid => {
    let res = await query(`SELECT DISTINCT c.client_id, c.app_name, c.app_url 
                            FROM oauth_access_tokens t  
                            JOIN oauth_clients c ON t.client_id = c.client_id
                            WHERE t.user_id = ?; 
                            `, [uid]);
    return res.map( row=>({
        id: row.client_id,
        name:row.app_name,
        url:row.app_url 
    })) 
  },

  /**
   * Remove access to this user's account for the listed clients.
   * It checks if ALL the clientIDs were deleted, if any fails, nothing is deleted.
   * Resolves to TRUE or throws error.
   * 
   * @param {number} uid 
   * @param {string[]} clientIDs 
   * @returns {Array<{ id:string, name:string, url:string }>}
   */
  revokeClientsFrom: async (uid, clientIDs) => {

    let clients   = await model.getConnectedClientsTo(uid);  
        clients   = clients.filter( c=>clientIDs.indexOf(c.id)>-1 );

    if(!clients.length) return true;

    const tran      = await transaction();  

    //
    // delete services
    //
    // const del = await tran.query(`DELETE t1, t2 FROM oauth_authorization_token t1 
    //                                 RIGHT JOIN oauth_access_tokens t2 ON t1.client_id=t2.client_id AND t1.user_id=t2.user_id
    //                                 WHERE t1.client_id IN (?) AND t1.user_id=?`,[ clientIDs, uid ]);
    const del = await tran.query(`
                                    DELETE t1, t2 
                                    FROM oauth_access_tokens t1
                                    LEFT JOIN oauth_authorization_token t2 ON t1.client_id = t2.client_id AND t1.user_id = t2.user_id
                                    WHERE t1.client_id IN (?) AND t1.user_id = ?`, 
                                    [clientIDs, uid]
                                );

    if( del.affectedRows==0 )
    { 
        await tran.abort("Failed to delete conected services...");
    }

    //
    // check the provided clients were deleted...
    //
    let q = query;
    query = tran.query; // not pretty i know...

    let afterClients = await model.getConnectedClientsTo(uid);

    query = q;

    if( afterClients.some(c=>clientIDs.indexOf(c.id)>-1) )
    {
        console.log(afterClients)
        await tran.abort("Failed to delete some of the requested clients, so aborted the entire operation. Nothing was deleted.");
    }
 
    await tran.commit();

    return afterClients;
  },

  /**
   * Gets the services this user is currently running
   * @param {number} uid ID of user in weightxreps
   * @returns {DeveloperService[]}
   */
  getDeveloperServices: async (uid) => {

    let services = await query(`SELECT * FROM oauth_clients WHERE uid=? ORDER BY id DESC`, [uid]);

    return services.map( row=>({ 
        id: row.client_id,
        dbid: row.id,
        name: row.app_name,
        url: row.app_url,
        redirectUris: row.redirect_uri.split(",")
    }));

  },

  /** 
   * @param {number} uid  ID of the weightxreps user that created this client app
   * @param {string} cid Client id (namespace)
   * @param {string} name Name of the app
   * @param {string} url Url to visit the app that will use this client.
   * @param {string[]} redirectTo urls that are valid to redirect to when the user grants access to this client.
   */
  createClient: async (uid, cid, name, url, redirectTo) => {

    //
    // validate urls...
    //
    redirectTo = validateRedirectTos(redirectTo);

    try{
        validateRedirectTos(url);
    }catch(e)
    {
        throw new Error(`Invalid app's url.`);
    }
    
    
    const client_secret = crypto.randomBytes(32).toString('hex');

    let newClient = {
        client_id:cid,
        app_name:name,
        app_url:url,
        redirect_uri:redirectTo,
        client_secret,
        uid
    }; 

    // will throw error if client id is duplicated.
    let op = await query(`INSERT INTO oauth_clients SET ?`, newClient );

    if( !op.insertedRows ) {
        throw new Error("Failed to create client, idk why...");
    }

    return {
        dbid: op.insertId,
        id: cid,
        name,
        url,
        redirectUris: redirectTo,
        secret: client_secret
    }; 
  },

  /**
   * Removes all data from that developer...
   * @param {number} uid weightxreps user's id
   * @returns {number} the number of rows deleted... 
   */
  deleteDeveloperData: async (uid)  => {
    // let del = await query(`DELETE t1, t2, t3 FROM 
    //                         oauth_clients t1 
    //                         LEFT JOIN oauth_access_tokens t2 ON t2.client_id=t1.client_id 
    //                         LEFT JOIN oauth_authorization_token t3 ON t3.client_id=t1.client_id 
    //                         WHERE t1.uid=?`, []); 
    let del = await query(`DELETE FROM oauth_clients WHERE uid=?`, [ uid ]);
    return del.affectedRows;
  },

  validateRedirectUri: (redirectUri, client) => {
    const normalizedRedirectUri = normalizeUri(redirectUri);
    return client.redirectUris.some(uri => normalizeUri(uri) === normalizedRedirectUri);
  }

} 


/** 
 * @param {string} uri 
 * @returns 
 */
const normalizeUri = uri => uri.replace(/\/+$/, '');


function validateRedirectTos( redirectTos ) {

    if( typeof redirectTos=='string' )
    {
        redirectTos = [redirectTos];
    }

    if( redirectTos.length==0 )
    {
        throw new Error("The redirect urls list is empty. You must define at least one URL to accept the authorization token.")
    }

    return redirectTos.every((url,i) => { 
        try { 
          return isValidUrl(url);
        } catch (error) {
          throw new Error(`Error while parsing redirect url #${i+1} saying: ${error.message}`);
        }
      })
}

function log({ title, parameters }) {
  console.log(title, parameters)
}

module.exports = model;