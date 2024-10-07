import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from "firebase-admin/auth";
import { query } from "../connection.js";
import { packAsToken } from "../../utils/token.js";

import { sendWelcomeMessage } from "./inbox.js";
import md5 from 'md5';
import { promises as fs } from 'fs';
import path from 'path';

import { getInvalidUsernameError } from '../../utils/getInvalidUsernameError.js';


async function initializeFirebase() {
    const credentialPath = path.resolve('../../firebase-adminsdk-credential.js');

    try {
        await fs.access(credentialPath);
        const module = await import(credentialPath);
        const key = module.default;
        initializeApp({
            credential: cert(key)
        });
        console.log('Firebase initialized successfully');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('Firebase credential file not found. Skipping initialization. LoginWithFirebase will fail if called...');
        } else {
            console.error('Error initializing Firebase:', error);
        }
    }
}

initializeFirebase();


//npm install firebase-admin --save
export const LoginWithFirebase = async (parent, args, context) => {

    const tokenInfo = await getAuth().verifyIdToken(args.token);
    var email = tokenInfo.email; //<---- puede no venir.
    const emailVerified = tokenInfo.email_verified;
    const providerID = tokenInfo.firebase.sign_in_provider;
    const phoneNumber = tokenInfo.phone_number;
    const uid = tokenInfo.uid;
    const user = await getAuth().getUser(uid);
    const providerInfo = user.providerData.find(p => p.providerId == providerID);
    //console.log("TOKEN VERIFICADO ---->", tokenInfo);

    console.log("USER--->", providerInfo);

    email = email || providerInfo.email;


    let what = "email=?";
    let matchThis = email;

    //
    // si vino el telefono, hizo login por telefono...
    // el password que creamos se vuelve el identificador unico...
    //
    if (tokenInfo.firebase.sign_in_provider == 'phone') {
        const phoneHASH = md5(`${uid}:${phoneNumber}`);
        what = `phoneHASH=?`;
        matchThis = phoneHASH;
        args.phoneHASH = phoneHASH;
        email = "";
    }
    else if (!email) {
        console.log(tokenInfo)
        throw new Error(`Login with [${providerID}] must have a verified email associated with it.`);
    }

    const exists = await query(`SELECT id, uname FROM users WHERE ${what} LIMIT 1`, matchThis);

    if (exists.length) {
        // hacerle login
        return packAsToken({
            id: exists[0].id,
            uname: exists[0].uname
        }); // id, uname
    }

    //
    // usuario debe proveer un username para crear la cuenta.
    //
    if (!args.uname) {
        throw new Error("PICK-UNAME");
    }

    const unameError = getInvalidUsernameError(args.uname);

    if (unameError) {
        throw new Error(`PICK-UNAME|Username "${args.uname}" has this error: ${unameError}`);
    }

    const unameOK = await query(`SELECT id FROM users WHERE uname=? LIMIT 1`, [args.uname]);

    if (unameOK.length) {
        throw new Error(`PICK-UNAME|Username "${args.uname}" is already taken! Pick another...`);
    }

    // todo ok!!! crearlo....
    return await doSignup({ email, ...args });

    // .then((decodedToken) => {
    //     const uid = decodedToken.uid;

    //     const email         = decodedToken.email; //<---- puede no venir.
    //     const emailVerified = decodedToken.email_verified;
    //     const providerID    = decodedToken.firebase.sign_in_provider;

    //     console.log( decodedToken )
    //     // ...
    //     return "UID = "+uid;
    // })
    // .catch((error) => {
    //     console.error(error)
    //     throw new Error("Invalid token");
    // }); 
}


const doSignup = async ({ uname, isf, usekg, email, phoneHASH, pass = "" }) => {

    const op = await query(`INSERT INTO users SET ?`, {
        deleted: 0,
        email,
        uname,
        supporterLevel: 0,
        days_left_as_supporter: 0,
        isFemale: isf == 1 ? 1 : 0,
        joined: new Date(),
        rank: 0,
        pass,
        usekg: usekg == 1 ? 1 : 0,
        bw: 0,
        hidebw: 0,
        private: 0,
        custom1RM: 0,
        availableDownloads: 0,
        blockedusers: "",
        phoneHASH
    });

    //
    // cool!
    //
    if (op.affectedRows) {
        //
        // mensaje de bienvenida...
        //
        await sendWelcomeMessage(op.insertId);


        //success!!!!
        //
        return packAsToken({ id: op.insertId, uname }); // id, uname
    }

}