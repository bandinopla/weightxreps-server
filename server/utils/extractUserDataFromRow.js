import { getForumRoleById } from "../db/resolvers/forum.js";
import { getAvatarHash } from "./get-avatar-hash.js";



export default function extractUserDataFromRow( row ) {
    let today           = new Date();
 
    if( row.deleted || row.uname.indexOf("[deleted]")>-1 )
    {
        return {
            id: row.id,
            avatarhash:"",
            uname: "[deleted]",
            cc:"xx",
            slvl: 0,
            sok: 0,
            sleft:0,
            private:false,
            isf:row.isFemale,
            joined: row.joined.toUTCString(),
            usekg: row.usekg
        }
    }

    return {
        id: row.id
        , avatarhash: getAvatarHash(row.id)
        , uname: row.uname
        , cc: row.country_code
        , slvl: row.supporterLevel
        , sok: Number(row.days_left_as_supporter>0)
        , sleft: row.days_left_as_supporter
        , age: row.bday? Math.floor( (today.valueOf()-row.bday.valueOf()) / 31557600000 ) : null
        , bw : row.bw
        , private: row.private
        , isf: row.isFemale
        , joined: row.joined.toUTCString()
        , usekg: row.usekg
        , forumRole : getForumRoleById( row.forumRole )?.key
    }
}