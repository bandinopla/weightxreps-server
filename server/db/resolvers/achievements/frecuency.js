import Achievement from "./base.js";
import { query } from "../../connection.js"
import { getAllOfficialEnames, getAllOfficialETags } from "../../../utils/ename2type.js";

 




class Frecuency extends Achievement {
    constructor(x, daysSpan, maxDaysOff, minWorkouts, maxWorkouts, idName='MISSION'){ 
        
        super(`${x}-${idName}`, 
                minWorkouts==maxWorkouts?`Pure Insanity` :`On a mission! High frequency!`, 
                (minWorkouts==maxWorkouts? `Trains this exercise ${minWorkouts} days in the last ${daysSpan} days` : `Trained this exercise between ${minWorkouts} and ${maxWorkouts} days in the last ${daysSpan} days`) + ` with no more than ${maxDaysOff} days off in between workouts.`
                );

        this.x = x;
        this.span = daysSpan;
        this.minWorkouts = minWorkouts;
        this.maxWorkouts = maxWorkouts;
        this.maxDaysOff = maxDaysOff;

    }

    async getAchievementsStateOf( uid, ymd ) {

        const validEnames   = getAllOfficialEnames([ this.x ]);
        const validEtags    = getAllOfficialETags([ this.x ]);

        const exercises     = await query(`SELECT id, nombre FROM exercises 
                                                WHERE 
                                                uid=?
                                                AND (nombre IN (?) OR nombre REGEXP ?)`, 
                                                [ uid, 
                                                    validEnames, 
                                                    "("+validEtags.join("|")+")\\b" ]);
 
         //
        // sin exercises, no hay nada que hacer...
        //
        if( !exercises.length )
            return false; 
 

        const results   = await query(`SELECT A.eid, A.wkg, A.inlbs, B.fecha_del_log 
                                            FROM erows AS A 
                                            INNER JOIN logs AS B ON B.id=A.logid 
                                            
                                            WHERE 
                                            
                                            A.uid=? AND 
                                            A.eid IN (?) AND

                                            B.fecha_del_log >= DATE_SUB(?, INTERVAL ${this.span} DAY)
                                            
                                            ORDER BY B.fecha_del_log ASC `,[uid, exercises.map(e=>e.id), ymd]); 
 
        if( !results.length )
        {
            return false;
        }
 
        if( this.x=='BP' && this.maxDaysOff>0)
            {
                console.log("DAYS TRAIN ", results )
            }

 
        //
        var lastDate;
        var days = 1;
        

        for (let i = 0; i < results.length; i++) {
            const row = results[i];

            if( !lastDate )
            {
                lastDate = row.fecha_del_log;
                continue;
            }

            if( row.fecha_del_log.valueOf()==lastDate.valueOf() ) {
                continue;
            }

            //cuantos dias pasaron desde la ultima vez?
            // esos son los dias off... break si es mayor al maximo.
            var time_difference = row.fecha_del_log.getTime() - lastDate.getTime();  
            var days_difference = (time_difference / (1000 * 60 * 60 * 24))-1;  

            if( days_difference>this.maxDaysOff )
            {
                

                return false;
            }

            days++; 
            lastDate = row.fecha_del_log;
        }  
        

        if( days<this.minWorkouts || days > this.maxWorkouts )
        { 
            return false;
        }



        return { 
            when: results[0].fecha_del_log,
            note: `${days} workouts in the last ${this.span} days.`
        }
    }
}
 

export default Frecuency;
