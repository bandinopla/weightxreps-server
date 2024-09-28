const path = require('path') // has path and __dirname
const express = require('express')
const router = express.Router()
const oauthUserAuthorizeScreen = path.join(__dirname, './oauthAuthenticate.html')
const oauthServer = require('./server.js');


router.get('/client-login', (req, res) => res.sendFile(path.join(__dirname, './clientAuthenticate.html')))
router.get('/client-app', (req,res) => res.sendFile(path.join(__dirname, './clientApp.html')))

//
// screen were the user authorizes the client app to connect to weightxreps.
//
router.get('/', (req, res) => {  // send back a simple form for the oauth
    res.sendFile(oauthUserAuthorizeScreen)
});

router.post('/authorize', (req, res, next) => { 
    const { username, password } = req.body
    if (username === 'username' && password === 'password') { //<--- usuario en nuestra base
        req.body.user = { user: 1 }
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