import { query } from "../connection.js";
import { TWITTER_CHALLENGES } from "./Twitter/Challenges.js";
import { ContainsStringForDays } from "./Twitter/ContainsStringForDays.js";
import { getTweetById } from "./Twitter/TwitterChallenge.js";

 

async function execTweet(uid, tweetID, type, fecha, granted, setGranted) {
	const challenge = TWITTER_CHALLENGES[type];

	if (!challenge) {
		throw new Error("Unknown twitter challenge id: " + type);
	}

	return await challenge
		.setState(tweetID, uid, fecha, granted)
		.exec(setGranted);
}

export const TwitterResolver = {
	Query: {
		getTwitterChallenges: async () => {
			const rtrn = [];

			for (const key in TWITTER_CHALLENGES) {
				if (Object.hasOwnProperty.call(TWITTER_CHALLENGES, key)) {
					const challenge = TWITTER_CHALLENGES[key];
					rtrn.push({
						type: key,
						title: challenge.title,
						description: challenge.getDescription(),
					});
				}
			}

			return rtrn;
		},

		getTwitterChallengesStates: async (_, __, { session: { id: uid } }) => {
  

			const rtrn = [];

			const rows = await query(`SELECT * FROM twitter_ids WHERE ${ uid==0?"granted=0": "uid=?" }`, uid==0? null: [uid] );

			for (let i = 0; i < rows.length; i++) 
            {
				const row = rows[i];
				let statusText;

				try {
					statusText = await execTweet(
						row.uid,
						row.id,
						row.type,
						row.fecha,
						row.granted,

						async () => {
							return await query(
								`UPDATE twitter_ids SET granted=1 WHERE id=?`,
								[row.id]
							);
						}
					);
				} catch (err) {
					statusText = `This error happened ---> ${err.toString()}`;
				}

				rtrn.push({
					tweet: row.id.toString(),
					type: row.type,
					fecha: row.fecha,
					granted: row.granted,
					status: statusText,
				});
			}

			return rtrn;
		},
	},

	Mutation: {
		setTweet: async (_, { id, type }, { session: { id: uid } }) => {
			try {
				if (!TWITTER_CHALLENGES[type])
					throw new Error("Unknown challenge type. ");

                    console.log("TWEET ID: " , id)
				await TWITTER_CHALLENGES[type].getTweet(id);

				var insert = await query(
					`INSERT INTO twitter_ids SET ?`,
					{
						id,
						type,
						uid,
						fecha: new Date(),
						granted: false,
					},
					true
				);

				if (!insert.affectedRows) throw new Error("Unknown error...");
			} catch (e) {
				if (e.code == "ER_DUP_ENTRY") {
					throw new Error(
						"That tweet id has already been used. Can't repeat tweets!"
					);
				} else if (e.statusCode == 404) {
					throw new Error(
						"That tweet doesn't exist or at least it can't be reached. "
					);
				} else {
					throw e;
				}
			}

			return true;
		},

		deleteTweet: async (_, { id }, { session: { id: uid } }) => {
 
			const deletion = await query(
				`DELETE FROM twitter_ids WHERE id = ? AND uid=? AND granted=0`,
				[id, uid]
			);

			return deletion.affectedRows == 1;
		},
	},
};



export const TwitterCronJob = async () => {

    let wait = 1000*60*60*12; // each 12 hours...

    try 
    {
        await TwitterResolver.Query.getTwitterChallengesStates(null, null, { session:{ id:0 }});
    }
    catch( e )
    {
        //.... mmmh....
        wait = 1000*60*30; // 30 min....
    } 

    setTimeout( TwitterCronJob, wait); //wait);

}