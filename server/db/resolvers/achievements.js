import CanYXPlates from "./achievements/can-y-x-plates.js";
import Frecuency from "./achievements/frecuency.js";


const LAST12WEEKS = 7*12;

const achievements = [

    new CanYXPlates("SQ", 1, LAST12WEEKS), 
    new CanYXPlates("SQ", 2, LAST12WEEKS), 
    new CanYXPlates("SQ", 3, LAST12WEEKS), 
    new CanYXPlates("SQ", 4, LAST12WEEKS), 
    new CanYXPlates("SQ", 5, LAST12WEEKS), 
    new CanYXPlates("SQ", 6, LAST12WEEKS),  
    new CanYXPlates("SQ", 7, LAST12WEEKS),  
    new Frecuency("SQ",7,2,3,6),
    new Frecuency("SQ",7,0,7,7,"INSANE"),

    // #BP
    new CanYXPlates("BP", 1, LAST12WEEKS), 
    new CanYXPlates("BP", 2, LAST12WEEKS), 
    new CanYXPlates("BP", 3, LAST12WEEKS), 
    new CanYXPlates("BP", 4, LAST12WEEKS), 
    new CanYXPlates("BP", 5, LAST12WEEKS), 
    new Frecuency("BP",7,2,3,6),
    new Frecuency("BP",7,0,7,7,"INSANE"),


    // #BP
    new CanYXPlates("DL", 1, LAST12WEEKS), 
    new CanYXPlates("DL", 2, LAST12WEEKS), 
    new CanYXPlates("DL", 3, LAST12WEEKS), 
    new CanYXPlates("DL", 4, LAST12WEEKS), 
    new CanYXPlates("DL", 5, LAST12WEEKS), 
    new CanYXPlates("DL", 6, LAST12WEEKS), 
    new CanYXPlates("DL", 7, LAST12WEEKS), 
    new Frecuency("DL",7,2,3,6),

    // #OHP
    new CanYXPlates("OHP", 1, LAST12WEEKS),  
    new CanYXPlates("OHP", 2, LAST12WEEKS),  
    new CanYXPlates("OHP", 3, LAST12WEEKS),  
    new Frecuency("OHP",7,2,3,6),

]


export const AchievementsResolver = {  
    Query: {
        getAchievements: async (parent, args, context )=>{ 
             return achievements.map(a=>({
                id: a.id, 
                name: a.name, 
                description: a.description
             }))
        },

        getAchievementsStateOf: async (parent, { uid, asOfThisYMD }, context )=>{

            let ymd    = asOfThisYMD.replace(/^(\d{4})(\d{2})(\d{2})$/,"$1-$2-$3");
 
             return await Promise.all( achievements.map(a=>{

                return new Promise( async (resolve, reject)=>{

                    var res = await a.getAchievementsStateOf( uid, ymd );
                    var rtrn = {
                        aid: a.id, 
                        gotit: false
                    };

                    if( res )
                    {
                        rtrn = {
                            ...rtrn,
                            ...res,
                            gotit: true
                        }
                    }
 
 
                    resolve( rtrn )

                });

             }) );
        }
    }
}