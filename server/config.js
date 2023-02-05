import * as dotenv from 'dotenv' 
dotenv.config();


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
        user: process.env.NOTIFICATIONS_EMAIL,
        pass: process.env.NOTIFICATIONS_EMAIL_PASSWORD
    },

    googleClientID: process.env.GOOGLE_CLIENT_ID
}
  
export default $global; ;