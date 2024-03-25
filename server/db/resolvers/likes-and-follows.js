import { query } from "../connection.js";
import extractUserDataFromRow from "../../utils/extractUserDataFromRow.js";

export const LIKE_TYPES = {
    LOG: 1,
    MESSAGE:3,
    FORUM_MESSAGE_LIKE:4,
    FORUM_MESSAGE_DISLIKE:5,
}

const __like = async ( likeType, opositeType, _, args, context ) => {

     
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

    const current = await query("SELECT id FROM likes_history WHERE uid=? AND type_id=? AND source_id=?", [ myID, likeType, sourceID ]);

    if( current.length>0)
    {
        if( !unlikeMode )
        {
            if( opositeType )
            {
                // in this case, if we like an already liked source, we will toggle the like.
                unlikeMode = true; 
            }
            else 
            {
                //ya existe...
                return "";
            }
            
        }
        
    }


    await query("DELETE FROM likes_history WHERE uid=? AND type_id=? AND source_id=?", [ myID, likeType, sourceID ]);

    if( opositeType )
    {
        const opposite = await query("DELETE FROM likes_history WHERE uid=? AND type_id=? AND source_id=?", [ myID, opositeType, sourceID ]);
        var oppositeWasDeleted = opposite.affectedRows>0;
    }

    if( unlikeMode ) return "deleted!"; 

    var results = await query("INSERT INTO likes_history SET ?", {
        uid             : myID,
        type_id         : likeType,
        source_id       : sourceID,
        fecha           : new Date()
    });
 
    return (oppositeWasDeleted?"-":"") + results.insertId;
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

        },

        getFollowing: async( parent, args, context) => {
            const result = await query(`SELECT users.* 
                                    FROM follow 
                                    LEFT JOIN users ON users.id=follow.followingid
                                    WHERE follow.followerid=? AND users.deleted=0 
                                    ORDER BY follow.id DESC`, [ args.uid ]);
                                    
                  return result.map( row=>extractUserDataFromRow(row) );
        },

        getFollowers: async( parent, args, context) => {
            const result = await query(`SELECT users.* 
                                    FROM follow 
                                    LEFT JOIN users ON users.id=follow.followerid
                                    WHERE follow.followingid=? AND users.deleted=0
                                    ORDER BY follow.id DESC`, [ args.uid ]);
                                    
                                    return result.map( row=>extractUserDataFromRow(row) );
        }
    },
    Mutation: {
        likeMessage         : __like.bind(null, LIKE_TYPES.MESSAGE, false),
        likeJournalLog      : __like.bind(null, LIKE_TYPES.LOG, false),
        likeForumMessage    : __like.bind(null, LIKE_TYPES.FORUM_MESSAGE_LIKE, LIKE_TYPES.FORUM_MESSAGE_DISLIKE),
        dislikeForumMessage : __like.bind(null, LIKE_TYPES.FORUM_MESSAGE_DISLIKE, LIKE_TYPES.FORUM_MESSAGE_LIKE),


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

