const OAuth2Server = require('@node-oauth/express-oauth-server');
const model = require('./model')

module.exports = new OAuth2Server({
  model: model,
  grants: ['authorization_code', 'refresh_token'],
  accessTokenLifetime: 60 * 60 * 24, // 24 hours, or 1 day
  allowEmptyState: true,
  allowExtendedTokenAttributes: true,
})