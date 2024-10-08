 
const express = require('express')
const router = express.Router() 
const oauthServer = require('./server.js');  
const { default: getClientAppInfo } = require('./handlers/getClientAppInfo.js');
const { default: authorize } = require('./handlers/authorize.js');
const fs = require("fs");
const path = require("path");
const { default: $global } = require('../config.js');

//router.get('/', getClientAppInfo);
router.get("/", (req, res, next) => {

    //
    // in this case we return basic client info so the auth screen can show it to the user and know which client is requesting authorization
    //
    if (req.query.client) {
        getClientAppInfo(req, res, next)
    }

    //
    // we send to the frontend page that builds the authorization and login UI page.
    //
    else 
    {
        const queryString = req.query ? `?${new URLSearchParams(req.query).toString()}` : '';
        const root = $global.frontEndUrl || "/.."; 
        res.redirect( root+"/oauth"+queryString );  
    }
});


//router.get('/', (req, res)=>res.sendFile( path.join( __dirname , "./clientAuthenticate.html" ) ));

router.post('/authorize', ...authorize);

router.post('/token', oauthServer.token({
    requireClientAuthentication: { 
        //'authorization_code': false,
        'refresh_token':false
    },
})); 

// router.use('/secure', (req,res,next) => {
//     console.log('Authentication')
//     return next()
//   },oauthServer.authenticate({ scope:"ultra" }), require('./secure.js')) // routes to access the protected stuff


//res.locals.oauth.token.client.id --> id del usuario en wxr.

module.exports = {
    OAuthRouter: router,
    oauthServer
}