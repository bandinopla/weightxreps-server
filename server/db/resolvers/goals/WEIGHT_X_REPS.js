 

//const e1RM = (w,r) => w * (1 + (r / 35)) ;
const e1RM = (w,r) => r>1? w + (10/3)*r : w ;

/** 
 * @param {number} w Weight lifted
 * @param {number[]} sets reps done per set...
 * @returns {number} estimated 1RM
 */
function calc1RM ( w, sets )
{  
    let rm = e1RM( w, sets[0] ); // RM of the first set. No fatigue at all... from no one, all sets will add to this some %....
  
    let overallRM = rm; //RM so far...
    
    // find the % to add of each set...
    for (let i = 1; i < sets.length; i++) { 
 
        const lastReps  = sets[i-1];
        const reps      = sets[i];
        let reward     = 0.01;
        
        if( reps < lastReps ) //get less reward, not %1 but less...
        {
            // reps/lastReps
            reward *= reps/lastReps;

        }
        else if( reps > lastReps ) // means we didn't worked hard enough previously... 
        { 
            // previous/reps --> sumatoria de fatiga que tenemos...
            reward = sets.reduce( (r, rep, j)=>r+(j<=i? (reward * (rep/reps)) : 0) ,0)
            overallRM = e1RM( w, reps );
        }
        else { 
            // tenemos %1 fatiga... 
        }

        overallRM *= 1+reward;

    }

    return overallRM;
}

function roundToNearest5(kg) {
    return Math.round(kg / 5) * 5;
}
function roundKgToNearest5Lbs(kg) {
    const lbs = kg * 2.20462; // Convert kg to lbs
    const roundedLbs = Math.round(lbs / 5) * 5; // Round to nearest 5 lbs
    return roundedLbs;
}

/**
 * 
 * @param {number} target1RM the 1RM we want to equate...
 * @param {number} minPercent minimum % of the target1RM we are willing to work with...
 * @param {number} maxWeight max weight to brute force the loop...
 * @param {number} maxReps max reps to brute force the loop
 * @param {number} maxSets max set to brute force the loop 
 * @returns { {kg:number, lbs:number, reps:number, sets:number }[] } Options... sets that you can do to equate to the desired 1RM...
 */
function findCombinations(target1RM, minPercent=1, maxWeight = 500, maxReps = 10, maxSets = 10) {
    const results = [];

    for (let w = 1; w <= maxWeight; w+=5) {

        if( w/target1RM < minPercent ) continue; //ignore weights that are too light...

        for (let r = 1; r <= maxReps; r++) {
            for (let s = 1; s <= maxSets; s++) { 

                const e1RM = calc1RM( w, Array(s).fill(r))

                if (Math.abs(e1RM - target1RM) < 3) { 
                    results.push({ kg: roundToNearest5(w), lbs:roundKgToNearest5Lbs(w), reps: r, sets: s });
                    break;
                }
            }
        }
    }

    const reducedData = Object.values(
        results.reduce((acc, item) => {
          if (!acc[item.kg]) acc[item.kg] = { highest: item, lowest: item };
          if (item.reps > acc[item.kg].highest.reps) acc[item.kg].highest = item;
          if (item.reps < acc[item.kg].lowest.reps) acc[item.kg].lowest = item;
          return acc;
        }, {})
      ).flatMap(({ highest, lowest }) => highest===lowest? [highest] : [highest, lowest]);
       

    return reducedData;
}


export function goalWRS(goalWeight, goalReps, goalSets, minIntensity, currentWeight, currentReps) {
   
    const goal1RM = calc1RM( goalWeight, Array(goalSets??1).fill(goalReps??1));
    const e1RM = calc1RM( currentWeight, currentReps );
    const percent = e1RM / goal1RM;

    if( percent<minIntensity ) return 0;

    return (percent-minIntensity) / (1-minIntensity); 
}


export function suggestWRS(goalWeight, goalReps, goalSets, minIntensity, progress) {

    const goal1RM = calc1RM( goalWeight, Array(goalSets).fill(goalReps)) * ( minIntensity + (1-minIntensity) * progress );

    return findCombinations( goal1RM, minIntensity );
}