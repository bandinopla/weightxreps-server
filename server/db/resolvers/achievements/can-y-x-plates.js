import Achievement from "./base.js";
import { query } from "../../connection.js"
import { getAllOfficialEnames, getAllOfficialETags } from "../../../utils/ename2type.js";
import { lb2kg } from "../../../utils/lb2kg.js";




class CanYXPlates extends Achievement {
    constructor(y, x, inTheLastDays ){

        const kgW = 20 + x * 20 * 2;
        const kgL = 45 + x * 45 * 2;
        
        
        super(`CAN-${y}-${x}plate`, 
                `${x} plates each side`, 
                `In the last ${inTheLastDays} days ${inTheLastDays>7? "( "+(inTheLastDays/7)+" weeks )" :""} ~${kgW}kg / ~${Math.round(kgL)}lbs (OR MORE), a.k.a. ${x} plates, was lifted in this exercise. In gym terms a "plate" means the biggest plate on a comercial gym. Usually 20kg or 45lbs. 
                This achievement asumes a ( 20kg ~ 45lbs ) barbell and ${x} plates on each side of the bar lifted for at least 1 rep.`
                );
                
        this.liftID = y;
        this.kgW = kgW;
        this.kgL = lb2kg( kgL );
        this.inTheLastDays = inTheLastDays;
    }

    async getAchievementsStateOf( uid, ymd ) {

        const validEnames   = getAllOfficialEnames([ this.liftID]);
        const validEtags    = getAllOfficialETags([  this.liftID]);

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
                                            ((A.wkg>=${ this.kgW} AND A.inlbs=0) OR (A.wkg>=${ this.kgL} AND A.inlbs=1)) AND
                                            A.reps>=1 AND

                                            B.fecha_del_log >= DATE_SUB(?, INTERVAL ${this.inTheLastDays} DAY)
                                            
                                            ORDER BY B.fecha_del_log ASC LIMIT 1`,[uid, exercises.map(e=>e.id), ymd]); 

        if( !results.length )
        {
            return false;
        }
 

        return { 
            when: results[0].fecha_del_log,
            note: `#${ exercises.find(e=>e.id=results[0].eid).nombre }`
        }
    }
}
 

export default CanYXPlates;