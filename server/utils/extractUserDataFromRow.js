import { getAvatarHash } from "./get-avatar-hash.js";



export default function extractUserDataFromRow( row ) {
    let today           = new Date();
 

    return {
        id: row.id
        , avatarhash: getAvatarHash(row.id)
        , uname: row.uname
        , cc: row.country_code
        , slvl: row.supporterLevel
        , sok: Number(row.days_left_as_supporter>0)
        , age: row.bday? Math.floor( (today.valueOf()-row.bday.valueOf()) / 31557600000 ) : null
        , bw : row.bw
        , private: row.private
        , isf: row.isFemale
        , joined: row.joined.toUTCString()
        , usekg: row.usekg
    }
}