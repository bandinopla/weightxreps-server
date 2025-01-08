// types.d.ts

/**
 * Represents a reference to a row in the `erows` table.
 * 
 * @typedef {Object} Erow
 * @property {number} id - The unique identifier of the row.
 * @property {number} logid - The log ID associated with this row.
 * @property {number} uid - The user ID associated with this row.
 * @property {number} eid - The exercise ID associated with this row.
 * @property {number} block - The block number for the row.
 * @property {boolean} usedBW - Indicates if bodyweight was used during the exercise (true or false).
 * @property {number} added2BW - The added weight (if any) to bodyweight, in the correct unit.
 * @property {number} wkg - The weight used in kilograms.
 * @property {boolean} inlbs - Whether the weight is in pounds (true) or kilograms (false).
 * @property {number} reps - The number of repetitions performed.
 * @property {number} sets - The number of sets performed.
 * @property {string} comment - A comment related to the exercise row.
 * @property {number} rpe - The rating of perceived exertion for the exercise (scale of 1-10).
 * @property {number} distance - The distance covered in the exercise, in the chosen unit (optional).
 * @property {'cm'|'m'|'km'|'in'|'ft'|'yd'|'mi'|null} distance_unit - The unit for distance (optional).
 * @property {number} duration - The duration of the exercise in seconds (optional).
 * @property {number} type - The type of the exercise, represented by a tiny integer (optional).
 * @property {Date} ymd - The type of the exercise, represented by a tiny integer (optional).
 */

/**
 * Represents a goal in the system.
 * 
 * @typedef {Object} Goal
 * @property {number} id - The unique identifier for the goal.
 * @property {string} name - Name of the goal
 * @property {number} uid - The user ID associated with the goal.
 * @property {number} eid - The exercise ID associated with the goal.
 * @property {string} creationDate - The date when the goal was created (defaults to current timestamp).
 * @property {string} maxDate - The latest date by which the goal should be completed.
 * @property {string|null} completionDate - The date when the goal was completed, or null if not yet completed.
 * @property {number} type - The type of goal (0: Weight x Reps, 1: Weight x Distance [x Time], 2: Weight x Time).
 * @property {number} weight - The weight used in the goal, in the correct unit (e.g., kilograms).
 * @property {number} reps - The number of reps, distance, or time, depending on the goal type.
 * @property {number} time - The number of reps, distance, or time, depending on the goal type.
 * @property {number} distance - The number of reps, distance, or time, depending on the goal type.
 * @property {number} sets - The number of sets for the goal.
 * @property {string} comment - A comment or note about the goal.
 * @property {('cm'|'m'|'km'|'in'|'ft'|'yd'|'mi'|null)} dUnit - The unit of distance, if applicable (optional).
 * @property {boolean} tGoalFaster - Whether the goal aims for faster time (true: less time is better, false: more time is better).
 */

