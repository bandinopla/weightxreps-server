 

import { ymd2date } from "../../../utils/dateASYMD.js";
import { ename2type } from "../../../utils/ename2type.js";
import { query, transaction } from "../../connection.js";
import { execExercise } from "../exercises.js";
import { goalWxD } from "./WEIGHT_X_DISTANCE.js";
import { goalWRS, suggestWRS } from "./WEIGHT_X_REPS.js";
import { goalWxT } from "./WEIGHT_X_TIME.js";

const MIN_PERCENT = 0.7;


const GoalType = {
    WEIGHT_X_REPS: 0,
    WEIGHT_X_TIME: 1,
    WEIGHT_X_DISTANCE: 2
}
 
/** 
 * Based on the sets done, calculate the overall progress according to the provided goal definition.
 * 
 * @param {Erow[]} sets  -Ignore the "sets" of the erows. they will be counted as "sets=1"
 * @param {Goal} goal 
 * @returns {Number} a number betwen 0 and 1
 */
const calculateErowGoalProgress = ( sets, goal )=> {

    const weight = sets[0].wkg ;
    
    switch( goal.type )
    {
        case GoalType.WEIGHT_X_REPS:
            return goalWRS( goal.weight, goal.reps, goal.sets, MIN_PERCENT, weight, sets.map(row=>row.reps) );

        case GoalType.WEIGHT_X_TIME:
            return goalWxT( goal.weight, goal.time, goal.sets, goal.tGoalFaster, weight, sets.map( row=>row.duration ) );

        case GoalType.WEIGHT_X_DISTANCE:
            return goalWxD(weight, goal.distance, goal.time, goal.sets, goal.tGoalFaster, weight, sets.map( row=>[row.distance, row.duration] ))
    }

    return 0; 
}

/** 
 * @param {Goal} goal 
 * @param {Number} targetProgress 
 */
const calculateGoalOptions = ( goal, targetProgress, usekg ) => { 
    switch( goal.type )
    {
        case GoalType.WEIGHT_X_REPS:
            //`Progess ${ MIN_PERCENT + (1-MIN_PERCENT) *targetProgress } | ${targetProgress} \n`+
            return   suggestWRS( goal.weight, goal.reps, goal.sets, MIN_PERCENT, targetProgress )
                    .map( option=>`${usekg? option.kg : option.lbs }${usekg?"kg":"lb"} x ${option.reps} x ${option.sets}` )
                    .join("\n")
    }
    return "... no idea..."
}



export const GoalsResolver = {
    Query: {

        /**
         * Get the goals of this user up to the specified date or, default to the current date.
         */
        async getGoals(_, { uid, upToDate }, context) {

            upToDate ??= new Date().toISOString().split('T')[0];

            let goals = await query(`SELECT goals.* , ex.nombre AS ename, u.usekg
                            FROM goals 
                            LEFT JOIN exercises AS ex ON ex.id=goals.eid
                            LEFT JOIN users AS u ON u.id=goals.uid
                            WHERE goals.uid = ?
                            AND (
                                -- Case 1: Goal is completed (use creationDate to completionDate)
                                (completionDate IS NOT NULL AND ? BETWEEN creationDate AND completionDate)
                                -- Case 2: Goal is ongoing (use creationDate to maxDate)
                                OR (completionDate IS NULL AND ? BETWEEN creationDate AND maxDate)
                            );`, [uid, upToDate, upToDate]); 

            const cursorDate = ymd2date(upToDate);

            goals.forEach(goal=>{
                // lazy init the goal's progress chart values... 
                    goal.progress = [];
                    goal.plannedProgress = JSON.parse(goal.plannedProgress);  
                    const currentCursor = Math.floor(( cursorDate - goal.creationDate ) / (1000 * 60 * 60 * 24));
                    goal.options = calculateGoalOptions( goal, goal.plannedProgress[currentCursor], goal.usekg ) 
                
            })

                            
            //
            // now calculate the "progress" of each goal...
            //
            if ( goals.length ) {
                // need all erows of referenced goals in the date range of the goals...
                //
                // collect relevant erows... any erow that falls between the goal's start and end dates and 
                // use the same exercise that the goal...
                //
                const erows = await query(`SELECT   e.* , 
                                                    l.fecha_del_log AS ymd 
                                                    
                                            FROM erows AS e 
                                            LEFT JOIN logs AS l on e.logid=l.id 
                                            
                                            WHERE 
                                            e.eid IN (?) AND 
                                            l.fecha_del_log BETWEEN ? AND ?
                                            ORDER BY ymd ASC
                                            `, [
                    goals.map(r => r.eid),
                    goals.reduce(( A, B) => A.creationDate <  B.creationDate ? A : B).creationDate.toISOString().split('T')[0],
                    upToDate
                ]);  

                // for each erow... see in which goal it matches and find the progress...
                erows

                //
                // *** GROUP RELATED SETS ***
                // create an array of arrays. Where each array represents sets done with related Weight, Reps, Time or Distance...
                // example 2 erows of: 140x5x5 and 140x3 will be combined as [ 140x5, 140x5, 140x5, 140x5, 140x5, 140x3 ] each element is a single set.
                // if they were done one after the other on the same block when the user logged those sets... 
                //
                .reduce( (out, erow)=>{

                    let lastSets = out.at(-1);
                    const last = lastSets?.[0];

                    if( !last || ( last.ymd!=erow.ymd || last.eid!=erow.eid || last.type!==erow.type || last.block!=erow.block || last.wkg!=erow.wkg ) ) 
                    {
                        lastSets = [];
                        out.push( lastSets );
                    } 

                    lastSets.push(...Array(erow.sets).fill( erow )); 

                    return out;
                }, [])


                //
                // *** 
                // for each erow... (remember we just grouped them by sets...)
                //
                .forEach( sets => { //they come sorted: ORDER BY ymd ASC

                    const erow = sets[0];

                    //
                    // goals that care about this erow...
                    //
                    goals.filter(goal => goal.eid == erow.eid && //same exercise...
                                         goal.type == erow.type && //same work type...
                                         erow.ymd >= goal.creationDate && //starts at or afeter the creation of the goal...
                                         ((goal.completionDate ?? goal.maxDate) >= erow.ymd)) // set was done before or right at the end of the goal time limit.

                    //
                    // now we will see, according to this goal, how close this set was to the goal... and store this for the chart plot.
                    //
                    .forEach(goal => {
 
                        //
                        // how many days passed from the goal's start date and this set's ymd??
                        //
                        const differenceInTime = erow.ymd - goal.creationDate; // Difference in milliseconds
                        const dayIndex = differenceInTime / (1000 * 60 * 60 * 24); // Convert to days

                        

                        //fill the gaps (days where this exercise was not trained) with undefined....
                        while( goal.progress.length<dayIndex ) {
                            goal.progress.push(undefined); //nothing was done...
                        } 

                        //
                        // calculate the progress of this goal... on a given day, the exercise might be trained multiple times (mabe AM session and PM session...)
                        // pick the best score for that particular day...
                        //
                        const erowProgress = calculateErowGoalProgress( sets, goal ); 

                        if( !goal.progress[dayIndex] || goal.progress[dayIndex]<erowProgress ) {
                            goal.progress[dayIndex] = erowProgress;
                        }

                    }); 
                });
            }
 
            return goals.map(goal => ({
                id: goal.id,
                name: goal.name,
                uid,
                exercise: {
                    id: goal.eid,
                    name: goal.ename, 
                    type: ename2type(goal.ename)
                } ,
                creationDate: goal.creationDate,
                maxDate: goal.maxDate,
                completionDate: goal.completionDate,
                type: Object.keys(GoalType)[ goal.type ],
                weight: goal.weight ?? 1,
                reps: goal.reps ?? 0,
                time: goal.time ?? 0,
                distance: goal.distance ?? 0,
                sets: goal.sets ?? 1,
                comment: goal.comment,
                dUnit: goal.dUnit,
                plannedProgress: goal.plannedProgress , 
                progress: goal.progress,
                options: goal.options
            }));
        }
    },

    Mutation: {

        async setGoal(_, { eid, ename, startDate, type, weight, reps, sets, comment, plannedProgress }, context) {

            if( eid==0 )
            {
                // we must create this exercise....
                const ex = await execExercise( eid, ename, context.session.id);
                eid = ex.id;
            }
 
            startDate = new Date(startDate);
            const maxDate = new Date(startDate);
                  maxDate.setDate(startDate.getDate()+plannedProgress.length );
                 

            const goal = await query(`INSERT INTO goals SET ?`, {
                name:"",
                uid: context.session.id,
                eid,
                creationDate: startDate.toISOString().split('T')[0],
                maxDate: maxDate.toISOString().split('T')[0],
                plannedProgress: JSON.stringify(plannedProgress),
                type: 0,
                weight: weight ?? 1,
                reps, sets, comment
            });

            return goal.insertId;

        },

        async deleteGoal(_, { id }, context) {

            const goal = await query(`SELECT * FROM goals WHERE id=?`,[id]);
            if( !goal.length ) throw new Error("Fan't find that goal...");
            if( goal[0].uid != context.session.id) throw new Error("That goal doesn't belong to you. So you can't delete it ;)");

            const result = await query(`DELETE FROM goals WHERE id=?`, id);

            return result.affectedRows>0;

        }
    }
}