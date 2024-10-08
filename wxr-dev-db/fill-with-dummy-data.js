import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { query } from "../server/db/connection.js"; 
import { Resolvers } from "../server/db/Resolvers.js";
import { GetUserInfo } from "../server/db/resolvers/journal.js";
import { getWxrUserFromRequestToken } from "../server/db/resolvers/session.js";
import { dateASYMD } from "../server/utils/dateASYMD.js";
import fs from 'fs';
import * as dotenv from 'dotenv';
import { glob } from 'glob'

dotenv.config(); 

//---------------------------------------------------------------------------------------
//
//      The goal of this script is to truncate the database and fill it with random dummy data.
//      Run it like this ----> node wxr-dev-db/fill-with-dummy-data.js
//
//---------------------------------------------------------------------------------------

var DROP_TABLES = true;
var TOTAL_USERS = 3;
var LOGS_PER_USER = 7;
var MAX_EXERCISES_PER_JOURNAL = 4;
var PASSWORD_FOR_EVERYONE = "123456"; 
var VERBOSE = false;

const exercises     = ["Squat", "Bench Press", "Front Squat #sq", "Deadlift"];
const bwExercises   = ["Chinups","Pull Ups"]
 
//---------------------------------------------------------------------------------------

async function seed()
{  
    console.log("Starting...") 

    let mode = DROP_TABLES?"DROP":"TRUNCATE";

    console.log("Reset mode = "+mode);

    const res = await query(`   SHOW TABLES;
                                SELECT CONCAT('${mode} TABLE \`',table_name,'\`;') 
                                FROM information_schema.tables 
                                WHERE table_schema = '${ process.env.DB_NAME }' ; 
                                SELECT 1
                                `); 

    let sql = "SET FOREIGN_KEY_CHECKS=0;" + 
        res[1].map( row=>Object.values(row)[0] ).join("\n") 
        + "SET FOREIGN_KEY_CHECKS=1;";

        if( VERBOSE )
            console.log( sql );

    await query( sql );

    // console.log("Recreating tables...");
    // const init = await query( fs.readFileSync("wxr-dev-db/sql/db-setup.sql", "utf-8") );  

    console.log("Running SQL files...");

    var sqlfiles = await glob('wxr-dev-db/sql/*.sql', {  } );

    sqlfiles = sqlfiles.sort();

    for (let I = 0; I < sqlfiles.length; I++) 
    {
        if( VERBOSE )
            console.log("Executing: "+ sqlfiles[I]);
        
        await query( fs.readFileSync(sqlfiles[I], "utf-8") );
    }
        
    


    console.log(`Creating ${TOTAL_USERS} users...`);

    //
    // Create users
    //
    for (let i = 0; i < TOTAL_USERS; i++) 
    { 
        const uname = `User${i+1}`; 
        const isf = Math.random()>0.5;
        const usekg = Math.random()>0.3;
        const bw = isf? 50 : 80;
        const bwToDefaultUnit = usekg? bw : Math.round(bw*2.204623);

        await Resolvers.Mutation.signup(null,{
            uname,
            email: `user${i+1}@fake.com`,
            pass: PASSWORD_FOR_EVERYONE,
            isf,
            usekg
        });
        
        const signup        = await query(`SELECT code FROM signup_users ORDER BY id DESC LIMIT 1`);
        const code          = signup[0].code; 
        const loginToken    = await Resolvers.Mutation.verifySignup(null, { code });

        const session       = getWxrUserFromRequestToken({
            headers: {
                authorization: `Bearer ${loginToken}`
            }
        }) ; 


        const userInfo = await GetUserInfo(
            session.id,
            session.id,
            false
        );

        const context = {
            session,
            userInfo
        }
 
        console.log(`Created ${uname}. Adding ${LOGS_PER_USER} journals to it...`);

        var today           = new Date();
        var todayASYMD      = dateASYMD(today, true);
        var logRows         = [];
        const userExercises     = [];

        for (let logIndex = 0; logIndex < LOGS_PER_USER; logIndex++) 
        {
            const rest = 1 + Math.round( Math.random()*3 );
            
            today.setDate(today.getDate() + rest);

            const logYMD = dateASYMD(today, true);

            logRows.push({ on:logYMD });
            logRows.push({ bw:bwToDefaultUnit, lb:usekg?0:1 }); 

            //
            // add a random tag
            //
            if( Math.random()>0.5 )
            {
                logRows.push({ tag:"I feel like", value: ["shit", "superman", "quitting", "pure success"][ Math.floor(Math.random()*4) ] , type:"TAG_STRING" });
            }

            logRows.push({ text:generateLoremIpsum(10) });

            //
            // add a random tag
            //
            if( Math.random()>0.5 )
            {
                logRows.push({ tag:"Planks for time", value: ["30", "10", "60" ][ Math.floor(Math.random()*3) ] , type:"TAG_TIME_sec" });
            }

            //
            // add a random tag
            //
            if( Math.random()>0.5 )
            {
                logRows.push({ tag:"Stretching session", value: ["1", "2.5", "3" ][ Math.floor(Math.random()*3) ] , type:"TAG_TIME_h" });
            }

            const total_exercises_in_workout = Math.round( Math.random()*MAX_EXERCISES_PER_JOURNAL );

            for (let e = 0; e < total_exercises_in_workout; e++) 
            {
                if( Math.random()>0.8 )
                {
                    logRows.push({ text:generateLoremIpsum(5) });
                }
                else 
                {
                    logRows.push( randomEblock(userExercises, usekg) );
                }
            } 

        } 

        if( userExercises.length )
        {  
            userExercises.forEach( ename=>{
                logRows.push({
                    newExercise: ename
                })
            });
        } 
 

        await Resolvers.Mutation.saveJEditor(null, {

            defaultDate: todayASYMD,
            rows: logRows

        }, context );

        console.log(` %${Math.round( ((i+1)/TOTAL_USERS)*100 ) } done... ok!\n`);

    }


    //
    // send some likes & comments
    //
    console.log("Inserting some likes & comments on the logs...");

    const logids = await query(`SELECT id, uid FROM logs`);
    const likes = [];

    for (let l = 0; l < logids.length; l++) 
    {
        let uid = 1 + Math.floor( Math.random()*TOTAL_USERS );
        const { id:logid, uid:loguid } = logids[l]; 

        if( uid==loguid ){
            if( ++uid >= TOTAL_USERS )
            {
                uid = 1;
            }
        }

        //
        // Likes
        //
        await Resolvers.Mutation.likeJournalLog( null, { target:logid.toString() }, { session: { id: uid }} );


        //
        // Comment something
        //
        if( Math.random()>0.6 )
        {
            //
            // as a direct message or a public journal comment
            //
            const asDM = Math.random()>0.8;

            // add a comment
            await Resolvers.Mutation.sendMessage( null, {
                message: generateLoremIpsum(5 + Math.floor(Math.random()*10)),
                type: asDM? "DM" : "JCOMMENT",
                target: ( asDM? loguid : logid ).toString()
            },
            { session: { id: uid }});
        } 
    }  


    console.log("ALL DONE!")
}

function randomEblock( userExercises, usekg ) {

    const bw        = Math.random()>0.6;
    const enames    = bw? bwExercises : exercises;
    const ename     = enames[ Math.floor(Math.random()*enames.length) ] ;
    const erows     = 1+Math.floor(Math.random()*6);  

    let eid = userExercises.indexOf(ename);

    if( eid<0 )
    {
        eid = userExercises.push(ename) -1 ;
    } 
    
    const eblock = {
        eid: -eid, 
        erows: []
    }

    for (let set = 0; set < erows; set++) 
    {
        let com = Math.random()>0.8? generateLoremIpsum(3) : "";

        if( bw )
        {  
            eblock.erows.push({
                w: {
                    v: 5 + set*5,
                    usebw: 1,
                    lb: usekg? 0 : 1 
                },
                r: 1+Math.floor(Math.random()*10) ,
                s: 1+Math.floor(Math.random()*3) ,
                c: com,
                type: 0
            })
        }
        else 
        {   
            eblock.erows.push({
                w: {
                    v: 60 + set*10, 
                    lb: usekg? 0 : 1 
                },
                r: 1+Math.floor(Math.random()*10) ,
                s: 1+Math.floor(Math.random()*3) ,
                c: com,
                rpe: set+1==erows && Math.random()>0.5? 9 : 0,
                type: 0
            });
        }
    }

    return eblock;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

function generateLoremIpsum(numWords) {
    var lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer euismod ante vitae tempor commodo. Maecenas molestie a magna ut facilisis.";
    var words = shuffleArray( lorem.split(" ") );
    var result = "";
    for (var i = 0; i < numWords; i++) {
      result += words[i % words.length] + " ";
    }
    return result;
  }
  



// seed( process.argv[2]=='reset' ).then( ()=>{
//     console.log("Done. The database has been populated with dummy data!") 
//     process.exit();
// });

yargs(hideBin(process.argv))
  .command('seed', 'start the seeding', () => {}, (argv) => {
    
    DROP_TABLES = argv.dropTables;
    TOTAL_USERS = argv.totalUsers;
    LOGS_PER_USER = argv.logsPerUser;
    PASSWORD_FOR_EVERYONE = argv.passwords; 
    VERBOSE = argv.verbose;

    if( VERBOSE )
    {
        process.env.VERBOSE = "true";
        
    }

    console.log("*****")
    seed().then( ()=>{
        console.log("Done. The database has been populated with dummy data!") 
        process.exit();
    });
  })

  .option('totalUsers', {
    alias: 'tu',
    type: 'number',
    description: 'Total users to create', 
    default: TOTAL_USERS
  })

  .option('logsPerUser', {
    alias: 'lpu',
    type: 'number',
    description: 'Total log entries per user to create',
    default: LOGS_PER_USER
  })

  .option('passwords', {
    alias: 'ps',
    type: 'string',
    description: 'Every user\'s password',
    default: PASSWORD_FOR_EVERYONE
  })

  .option('dropTables', {
    alias: 'dt',
    type: 'boolean',
    description: 'true = DROP, false = TRUNCATE' 
  })

  .option('verbose', { 
    type: 'boolean',
    description: 'true = will console.log a bit more',
    default: VERBOSE
  })
 

  .demandOption(["dropTables"],"You must be clear to tell what to do with the tables...")
  .parse();
