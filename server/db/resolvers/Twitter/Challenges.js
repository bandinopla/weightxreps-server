import { ContainsStringForDays } from "./ContainsStringForDays.js";


/**
 * KEY must exist in the TweetType GraphQL schema
 */
export const TWITTER_CHALLENGES = {

	"AS_DONATION": new ContainsStringForDays(
		"Tweet this = supporter for a week!",
		`Tweet this ↓
        -----------------
         %VALUE% 
        -----------------
        ...and keep that tweet online for at least %DAYS% days and you will be granted supporter status for ~WEEK.`
	).config("Check out weightxreps.net it is a cool site to log your workouts!", 6, 1)



	,"AS_DONATION2": new ContainsStringForDays(
		"Tweet this = supporter for A MONTH!",
		`Tweet this ↓
        -----------------
         %VALUE% 
        -----------------
        ...and keep that tweet online for at least %DAYS% days and you will be granted supporter status for a ~MONTH`

	).config("weightxreps.net is AWESOME! Check it out!", 30, 5),
};