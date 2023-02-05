import { query } from "../connection.js";



const __like = async ( likeType, _, args, context ) => {

     
    var sourceID    = args.target;
    let myID        = context.session.id; 
    let unlikeMode  = sourceID.indexOf("x")==0;
     

    if( unlikeMode )
    {
        sourceID = sourceID.substr(1);

        // var results = await query("DELETE FROM likes_history WHERE uid=? AND type_id=? AND source_id=?", [ myID, likeType, sourceID ]);

        // if( results.affectedRows==1 )
        // {
        //     return "deleted!";
        // }

        // throw new Error("Some crazy error happened...");
    } 

    await query("DELETE FROM likes_history WHERE uid=? AND type_id=? AND source_id=?", [ myID, likeType, sourceID ]);

    if( unlikeMode ) return "deleted!"; 

    var results = await query("INSERT INTO likes_history SET ?", {
        uid             : myID,
        type_id         : likeType,
        source_id       : sourceID,
        fecha           : new Date()
    });
 
    return results.insertId;
}

export const LikesAndFollowsResolver = {

    Query: {
        getFollowersCount: async ( parent, args, context )=>{

            const myId          = context.session?.id; 
            const result        = await query(`SELECT * FROM follow WHERE followingid=?`, [ args.uid ]);
            var has;

            //
            // Solo dejar consultar si tiene el usuario actualmente logueado. Esto solo lo hago para
            // no dar info de quién sigue a cualquiera.
            //
            if( args.has && args.has==String(myId) )
            {
                has = result.find( row=>row.followerid==myId )!=null;
            }

            return {
                total: result.length,
                has
            } ;

        }
    },
    Mutation: {
        likeMessage     : __like.bind(null, 3),
        likeJournalLog  : __like.bind(null, 1),


        follow  : async ( parent, args, context )=>{

            const unfollow      = args.not;
            const myId          = context.session.id; 
            const uid           = args.uid;

            if( unfollow )
            {
                const result = await query(`DELETE FROM follow WHERE followingid=? AND followerid=? LIMIT 1`,[ uid, myId ]);
                return result.affectedRows > 0;
            }
            else 
            {
                const addResult = await query(`INSERT INTO follow (followerid, followingid) 
                        SELECT * FROM (SELECT ? AS followerid, ? AS followingid) AS temp 
                        WHERE NOT EXISTS ( SELECT id FROM follow WHERE followerid=? AND followingid=? ) LIMIT 1`,[ myId, uid, myId, uid ]);

                return addResult.insertId>0;
            }

        }
    }
};

