import extractUserDataFromRow from "../../utils/extractUserDataFromRow.js";
import { query } from "../connection.js"



export const SupportResolver = {  
    Query: {
        getSupporters: async ()=>{ 
            return await _getSupporters(false); 
        },

        getActiveSupporters: async ()=>{
            return await _getSupporters(true);
        }
    }
}



const _getSupporters = async ( onlyActive )=> {

    var donations = await query(`SELECT MAX(X.fecha) AS donationDate, Y.* FROM 
    
                                       ( (SELECT uid, fecha FROM donations_history where donation>0) ) AS X 

                                        INNER JOIN users AS Y ON Y.id=X.uid AND Y.deleted=0 AND Y.id>1 
                                        GROUP BY uid
                                        ORDER BY donationDate DESC`);

    
   // var donations = await query( `SELECT * FROM users WHERE supporterLevel>0` )

            //var sup = await query(`SELECT * FROM users WHERE supporterLevel>0 ORDER BY supporterLevel DESC`);

            return donations.map( urow=>({
                        user    : extractUserDataFromRow(urow) 
                        , when  : urow.donationDate?.toISOString()
                    }))
                    
                    .filter( itm => !onlyActive || itm.user.sok )
                    ;

}