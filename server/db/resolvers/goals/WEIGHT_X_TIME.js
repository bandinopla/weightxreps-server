/**
 * Measures progress towards a weight × time goal.
 * @param {number} goalWeight - Target weight in kilograms.
 * @param {number} goalTime - Target time in seconds.
 * @param {number} goalSets - sets of this to do... How many sets for time to repeat...
 * @param {boolean} goalIsFast - True if less time is better, false if more time is better.
 * @param {number} weightUsed - Actual weight lifted by the user.
 * @param {number[]} timePerSet - Actual time (in seconds) taken by the user each set. The length of this array is the numbers of total sets done...
 * @returns {number} Progress score between 0 and 1.
 */
export function goalWxT(goalWeight, goalTime, goalSets, goalIsFast, weightUsed, timePerSet) {
    // Validate inputs
    if (!Array.isArray(timePerSet) || timePerSet.length === 0) {
        return 0;
    }

    // Calculate weight progress (0 to 1)
    const weightProgress = Math.min(weightUsed / goalWeight, 1);
    
    // Calculate average time per set
    const avgTime = timePerSet.reduce((sum, time) => sum + time, 0) / timePerSet.length;
    
    // Calculate time progress (0 to 1)
    let timeProgress;
    if (goalIsFast) {
        // For speed goals (less time is better)
        timeProgress = avgTime <= goalTime ? 1 : goalTime / avgTime;
    } else {
        // For endurance goals (more time is better)
        timeProgress = Math.min(avgTime / goalTime, 1);
    }
    
    // Calculate sets progress (0 to 1)
    const setsProgress = Math.min(timePerSet.length / goalSets, 1);
    
    // Combine all factors
    // Weight and time are averaged, then multiplied by sets progress
    return ((weightProgress + timeProgress) / 2) * setsProgress;
}