/**
 * Calculates progress towards a weight/distance/time-based fitness goal
 * @param {Number} goalWeight in kilograms
 * @param {Number} goalDistance in cm
 * @param {Number?} goalTime in seconds (can be 0 if we don't care about time)
 * @param {Number} goalSets how many times to repeat this Weight x Distance x Time
 * @param {Boolean} goalIsFast true=fast is better 
 * @param {Number} weightUsed 
 * @param {[distance:number, time?:number][]} distancePerSet On each set, how much distance and in what time (can be 0 if we don't care about time)...
 * @returns {Number} Progress score between 0 and 1
 */
export function goalWxD(goalWeight, goalDistance, goalTime, goalSets, goalIsFast, weightUsed, distancePerSet) {
    // Validate inputs
    if (!Array.isArray(distancePerSet) || distancePerSet.length === 0) {
        return 0;
    }

    // Calculate weight progress (0 to 1)
    const weightProgress = Math.min(weightUsed / goalWeight, 1);

    // Calculate average distance per set
    const avgDistance = distancePerSet.reduce((sum, [distance]) => sum + distance, 0) / distancePerSet.length;
    const distanceProgress = Math.min(avgDistance / goalDistance, 1);

    // Calculate time progress if time is being tracked
    let timeProgress = 1;  // Default to 1 if time isn't being tracked
    if (goalTime > 0) {
        // Only calculate time progress if we have valid time entries
        const validTimeEntries = distancePerSet.filter(set => set[1] != null && set[1] > 0);
        if (validTimeEntries.length > 0) {
            const avgTime = validTimeEntries.reduce((sum, [_, time]) => sum + (time || 0), 0) / validTimeEntries.length;
            
            if (goalIsFast) {
                // For speed goals (less time is better)
                timeProgress = avgTime <= goalTime ? 1 : goalTime / avgTime;
            } else {
                // For endurance goals (more time is better)
                timeProgress = Math.min(avgTime / goalTime, 1);
            }
        }
    }

    // Calculate sets progress (0 to 1)
    const setsProgress = Math.min(distancePerSet.length / goalSets, 1);

    // If we're tracking time, include it in the average
    const progressFactors = goalTime > 0 
        ? (weightProgress + distanceProgress + timeProgress) / 3
        : (weightProgress + distanceProgress) / 2;

    // Final score combines all factors, with sets as a multiplier
    return progressFactors * setsProgress;
}