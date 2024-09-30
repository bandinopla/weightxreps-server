const path = require('path') // has path and __dirname
const express = require('express')
const router = express.Router()
//const oauthUserAuthorizeScreen = path.join(__dirname, './oauthAuthenticate.html')
const oauthServer = require('./server.js');
const { oauth_scopes } = require('./scopes.js');
const fs = require('fs');
const { query } = require('../db/connection.js');

//router.get('/client-login', (req, res) => res.sendFile(path.join(__dirname, './clientAuthenticate.html')))
router.get('/client-app', (req,res) => res.sendFile(path.join(__dirname, './clientApp.html')))

//
// returns data to feed the OAuth confirmation screen to the user. Gets' details on the client id and the scope's descriptions.
//
router.get('/', async (req, res) => {   
    
    let clientId    = req.query.client_id; 
    let scopes      = req.query.scope?.split(",");

    //
    // validate client id
    //
    let row         = await query("SELECT * FROM oauth_clients WHERE client_id=?", [clientId]);

    if(!row.length) {
        res.status(404).send(`Client [${clientId}] not found`);
        return;
    }  

    //
    // validate scope
    //
    const validScope = scopes.every(element => !!oauth_scopes[element] );
 
    if(!validScope) {
        res.status(400).send(`Invalid/Unknown scopes requested: ${scopes}`);
        return;
    }

    const $confirmationScreenData = {
        scopes: scopes.reduce((out, scope)=>{
            out[scope] = oauth_scopes[scope];
            return out
        },{ read:"Read your logs" }),
        appName: row[0].app_name,
        appUrl: row[0].app_url
    };

    res.json($confirmationScreenData);

    // fs.readFile(oauthUserAuthorizeScreen, 'utf8', (err, data) => {
    //     if (err) {
    //       return res.status(500).send('Error reading file');
    //     }
        
    //     const modifiedData = data.replace('$config = {}', `$config = ${JSON.stringify()}`);
        
    //     res.send(modifiedData);
    //   });
});

router.post('/authorize', (req, res, next) => { 
    const { username, password } = req.body
    if (username === 'username' && password === 'password') { //<--- usuario en nuestra base
        req.body.user = { id: 1 }
        return next()
    }
    const params = [ // Send params back down
        'client_id',
        'redirect_uri',
        'response_type',
        'grant_type',
        'state',
        'code_challenge',
        'code_challenge_method',
        "scope"
    ]
        .map(a => `${a}=${req.body[a]}`)
        .join('&')
    return res.redirect(`/oauth?success=false&${params}`)
}, (req, res, next) => { // sends us to our redirect with an authorization code in our url
    console.log('Authorization')
    return next()
}, oauthServer.authorize({
    authenticateHandler: {
        handle: req => { 
            return req.body.user
        }
    }
}));

router.post('/token', (req, res, next) => {
    console.log('Token')
    next()
}, oauthServer.token({
    requireClientAuthentication: { // whether client needs to provide client_secret
        //'authorization_code': false,
        'refresh_token':false
    },
}) )  // Sends back token

router.use('/secure', (req,res,next) => {
    console.log('Authentication')
    return next()
  },oauthServer.authenticate({ scope:"ultra" }), require('./secure.js')) // routes to access the protected stuff


module.exports = {
    OAuthRouter: router,
    oauthServer
}