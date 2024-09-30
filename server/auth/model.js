// See https://oauth2-server.readthedocs.io/en/latest/model/spec.html for what you can do with this
const crypto = require('crypto')
const { query } = require('../db/connection')


module.exports = {

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
      throw new Error("Could not found the requested authorization code: "+authorizationCode);
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
  }
}

function log({ title, parameters }) {
  console.log(title, parameters)
}