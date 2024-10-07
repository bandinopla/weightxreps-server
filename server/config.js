// import * as dotenv from 'dotenv' 
// dotenv.config();
import 'dotenv/config'


const $global = {
    communityStatsCacheForMinutes: 28,
    maxFileUploadSizeInKilobytes: 50,
    avatarUploadUrl:"../useravatar/",

    host    : process.env.DB_HOST,
    user    : process.env.DB_USER,
    pass    : process.env.DB_PASSWORD,
    dbname  : process.env.DB_NAME,
    port    : process.env.DB_PORT,

    mailer_auth_credentials: {
        user: process.env.NOTIFICATIONS_EMAIL,// <<---- if this value is empty then no email will be sent and a console.log will show what would've have been sent.
        pass: process.env.NOTIFICATIONS_EMAIL_PASSWORD
    },

    googleClientID: process.env.GOOGLE_CLIENT_ID,

    tokenSecret: process.env.TOKEN_SECRET,
    twitterConfig: process.env.TWITTER_CONFIG,

    frontEndUrl: process.env.FRONTEND_APP_URL ?? "http://weightxreps.net"
}
  
export default $global; ;