const OAuth2Server = require('@node-oauth/express-oauth-server');
const model = require('./model')
 

module.exports = new OAuth2Server({
    model: model,
    grants: ['authorization_code', 'refresh_token'], 
    requireClientAuthentication:false,
    allowEmptyState: false,
    allowExtendedTokenAttributes: true, 
  });;