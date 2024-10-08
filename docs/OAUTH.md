# OAuth2
### So you want to let your app act in behalf of weightxreps users to offer them new functionality?
You are in the right place! Here you find out how!

> The [Weight for Reps](weightxreps.net) endpoint for [OAuth2](https://oauth.net/2/) access runs in [Node.js](https://nodejs.org/en)/[express](https://expressjs.com/es/) using [oauth2-server](https://oauth2-server.readthedocs.io/en/latest/) with [@node-oauth/express-oauth-server](https://github.com/node-oauth/express-oauth-server)'s wrapper to allow developers to connect to our api in behalf of another user.


<br/>

# Creating your service
When you develop an app to act on behalf of a weightxreps user you must configure "a service" in your settings. Let's call your app a `service`. You must be a weightxreps user ( *create an account, it is free!* ), and in your settings page you will find at the bottom a section called **Developer Api**, that's were you will define your **developer config**.

## Configuration
In your settings, you go to edit your `config` that will be used to define, modify and delete services among other things ( *that might be added in the future* ) This is in [yaml](https://yaml.org/) format. The basic structure looks like this:

```yaml
services:
  - id: "dev.foo.com"
    dbid: "123"
    name: "Awesome Dev Foo App"
    url: "http://dev.foo.com"
    redirectUris:
      - "http://localhost:5173/wxr-login"
```
## Config structure
| key | desc |
| --- | --- |
| `services` | an `array` of services. Max length: `5` |
| `services[i].id` | `id` of your service. Should match `/^[a-zA-Z0-9._-]+$/`
| `services[i].dbid?` | Will appear and be set automatically, will link the service with the database. You don't need to touch this value at all..
| `services[i].name` | `string` to show to the user, the name of your app.
| `services[i].url` | `string` to link the user to your app. Will be shown to the user.
| `services[i].redirectUris` | `array` of valid URLs were you expect to recieve authorization tokens.
<br/>

# Conecting your app
## If using Javascipt...
In case you are using `javascript` to develop your app, use the npm [weightxreps-oauth](https://github.com/bandinopla/weightxreps-oauth) module.

## Other language ?
You can talk to the oauth server on your own:
- #### OAuth2 endpoint --> `https://weightxreps.net/api/auth`

Obtain user credentials using the [Authorization Code Flow with PKCE (Proof Key for Code Exchange)](https://oauth.net/2/pkce/). *Note that the code_verifier should not be longer than 64 chars (I store it in a VARCHAR(64) columnn...). And the code_challenge_method="S256" (SHA-256 hashed) or "plain" in which case code_challenge==code_verifier*


To get the access token you will follow this flow:

```
    +----------+                               +------------------+
    | your app |                               |  weightxreps.net |
    +----------+                               +------------------+
         |                                              |
         |   1. Authorization Request                   |
         | -------------------------------------------->|
         |    (GET /auth?grant_type=authorization_code  |
         |     &response_type=code                      |
         |     &client_id=...&redirect_uri=...          |
         |     &scope=...&state=...&code_challenge=...) |
         |                                              |
         |                                              |
         |                                              |
         |   2. User Authenticates & Grants Consent     |
         |                                              |
         | <--------------------------------------------|
         |    ( either redirect or...                   |
         |       the popup window will call             |
         |          window.opener.postMessage(...)      |
         |                                              |
         |   3. Token Request                           |
         | -------------------------------------------->|
         |    (POST /auth/token                         |
         |     grant_type=authorization_code            |
         |     &code=...&redirect_uri=...               |
         |     &code_verifier=...)                      |
         |                                              |
         |                                              |
         |                                              |
         |   4. Access Token Response                   |
         | <--------------------------------------------|
         |    (200 OK                                   |
         |     { access_token: ...,                     |
         |       refresh_token: ...,                    |
         |       ... }                                  |
         |                                              |
         |                                              |
         |   5. Access Protected Resources              |
         | -------------------------------------------->|
         |    (POST /api/graphql resource with          |
         |     Authorization: Bearer access_token)      |
         |                                              |
         |                                              |
         | <--------------------------------------------|
         |    (200 OK                                   |
         |     { ... resource data ... }                |
         |                                              |
         +----------------------------------------------+

```
 

## Authorization code from Popup
### If you open the authorization request url in a popup window...
... in that case the popup will send the authorization code back to you using [`window.opener.postMessage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) with `event.data.weightxrepsOnOAuthResult` = A or B
- A `{ error:"Some error message" }`
- B `{ code:"the authorizaton code"}` 
<br/><br/><br/>


# SCOPES | Available Permissions
When you ask for permission to a user, you will as the user what things you want to access or do, that info is sent in the `scope` parameter that is a `string` or comma separated values. The values are keys that represent things that can be done. The link bellow links to a javascript object with a sope per key with the description as it's value.

### Available scopes -> [server/auth/scopes.js](server/auth/scopes.js)


