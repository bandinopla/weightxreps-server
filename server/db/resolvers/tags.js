import { query } from "../connection.js";



export async function getUTags( uid, logids, onlyTagsWithValues ) 
{ 
    let tags        = await query(`SELECT id, name FROM tags WHERE uid=?`, [uid]);
    let utagValues  = []

    if( logids?.length )
    {
        let values = await query(`SELECT id, tagid, type, value, logid FROM tags_used WHERE logid IN (?) ORDER BY id`, [ logids ]);
        //let tagids = values.map( utag=>utag.tagid ); 

        //
        // only tags referenced in some of the logs
        //
        //tags = tags.filter( tag=>tagids.indexOf( tag.id )>-1 );
        

        //
        // this reduce on "logids" is set so we respect the order in which the logids come in that array
        // and values are written in chronological order because they are sorted by id
        //
        utagValues = logids.reduce( (out, logid)=>{


            values.filter( v=>v.logid==logid )

                //
                // push the values of each used tag in the same order in which the logsid was passed.
                //
                .forEach( v=>out.push( v ) )


            return out;
        }, [] );


        if( onlyTagsWithValues )
        {
            tags = tags.filter( t=>utagValues.some(tval=>tval.tagid==t.id) )
        }
 
    }
    
    return [ tags, utagValues ];
}

 


//
// add the "value" to each one of these user tags...
//
export async function addUTagsValuesForEditor( utagValueToken, utagValueTokens )
{
    const valIndex = utagValueTokens.findIndex( tval=> 
        
                                                    tval.tagid==utagValueToken.tagid
                                                        &&
                                                    tval.logid==utagValueToken.logid
                                              );

    if(  valIndex>-1 )
    {
        const tval = utagValueTokens.splice( valIndex ,1)[0];

        utagValueToken.value = tval.value;
        utagValueToken.type = tval.type;
    }  
}


/**
 * Atention! this text will be stored on the text of the log, it will be un-parsed by the mobile app.
 */
export function utagTokenToText( utagToken ) 
{ 
    return `UTAG:${utagToken.id}`;  //<--- "id" of the tag VALUE (not the id of the tag)
}

export function getUTagId( name, availableUTags )
{
    return availableUTags.find( utag=>utag.name.toLowerCase()==name )?.id ;
}

//
// recieves an array of editor Utags coming from a save operation
// adds an "id" with the corresponding ID of the referenced UTAG based on the type and name
// if none is found, it will be created and the new id will be added/completed.
//
export async function createNewTagsIfAny( query, uid, editorUtags, existingUTags )
{
    const newUTags = editorUtags.filter( utag=>{ 
                utag.tagid = getUTagId( utag.tag, existingUTags );
        return !utag.tagid;

    } );

    if( newUTags )
    {
        for (let i = 0; i < newUTags.length; i++) 
        {
            const utag       = newUTags[i];
            const duplicated = newUTags.find( ut=>ut.tag==utag.tag && ut.tagid>0 ) ;
            
            if( duplicated )
            {
                utag.tagid = duplicated.tagid;
            }
            else 
            {
                const added = await query(`INSERT INTO tags SET ?`, { uid, name:utag.tag });

                utag.tagid = added.insertId; 

                if( !utag.tagid )
                {
                    throw new Error(`Weird, failed to create tag [${ utag.tag}]`);
                }
            }
            
        }
    } 

}


/**
 * inserts the user tag values and adds the "id" of the row inserted into each element.
 */
export async function addEditorUtags( query, uid, utagTokens, logid )
{ 
    if( !utagTokens.length ) return;

    const rest = await query(`INSERT INTO tags_used (uid, logid, tagid, type, value) VALUES ?`, [ 
        utagTokens.map( token=>[
            uid, 
            logid, 
            token.tagid, 
            token.type,
            token.value
        ])
     ]);

    if( rest.affectedRows != utagTokens.length )
    {
        throw new Error("Unknown error while trying to add the tags...");
    }  

    utagTokens.forEach( (tval, i)=>{
        tval.id = rest.insertId + i;
    }); 
}

export async function deleteUTagsFromLog( query, logid )
{
    await query(`DELETE FROM tags_used WHERE logid=?`, [ logid ]); 
}


//
// delete tags not used by any log, to avoid "trash" tags
//
export async function deleteUnusedUTags(uid) 
{
    await query(`DELETE t1 FROM tags t1 
                        LEFT JOIN tags_used t2 ON t2.tagid=t1.id 
                        WHERE t2.id IS NULL`);
}


//
// returns a schema "JRangeUTags" object
//
export async function getUTagsRangeData( uid, from, to ) 
{
    let [utags]         = await getUTags(uid); 

    const uses = await query(`SELECT A.tagid, A.type, A.value, B.fecha_del_log AS ymd 
                                FROM tags_used AS A 
                                INNER JOIN logs AS B ON B.id=A.logid 
                                WHERE A.uid=? AND B.fecha_del_log BETWEEN ? AND ?
                                ORDER BY B.fecha_del_log
                                `, [ uid, from, to]);

    //#region Add automatic tags
    //
    // create "automatic" tag for "bodyweight"
    //
    utags.unshift({
        id: "bw", 
        name: "Bodyweight",
        automatic: true
    }); 
     
    const logs = await query(`SELECT CAST(bw * 1000 AS UNSIGNED) AS value, 
                                     fecha_del_log AS ymd
                                    
                                FROM logs 
                                WHERE uid=? AND bw>0 AND fecha_del_log BETWEEN ? AND ? ORDER BY fecha_del_log`,  [ uid, from , to ]);
     
    logs.forEach( log=>{
 
        let tuse = {
            tagid:"bw",
            type: "TAG_BW",
            value: log.value,
            ymd: log.ymd
        };

        uses.push( tuse ); 

    } );

    //#endregion


    if( !uses.length ) 
    {
        return null;
    }

    //
    // only the tags used in this range.
    //
    utags = utags.filter( utag=>uses.find( row=>row.tagid==utag.id ) ); 
     

    return {
        tags: utags, 
        values:uses
    };
}

export function preventDuplicatedUTagsOnSave( utagToken, store )
{
    //
    // i saw, give the user the freedom to do whatever.
    // Common sense rules here... if you declare a tag multiple times with diferent values 
    // on the same day i will assume you know what you are doing. 
    //
    return true; 

    // the code belows only lets one tag per day with the same name. The last value will be the one put on the tag.

    // //true si no esta (tag, type)
    // const existing = store.find( itm=>itm.tag==utagToken.tag );

    // if( existing )
    // {
    //     //
    //     // update it: if 2 or more tags with the same name are declared, the last one will be the one created.
    //     //
    //     existing.value  = utagToken.value;
    //     existing.type   = utagToken.type; 

    //     return false;
    // }
    // else 
    // {
    //     return true;
    // }
}

export async function addUtagsValuesToFeedUCards( ucards ) 
{
    //ids de tags que tenemos que obtener....
    const tvalIds = ucards.flatMap( uc=>uc.utags?.values ?? []);  

    if( !tvalIds.length ) return;

    const res = await query(`SELECT A.id, A.uid, B.id AS tagid, B.name, A.type, A.value 
                           FROM tags_used AS A
                           INNER JOIN tags AS B ON B.id=A.tagid 
                           WHERE A.id IN (?)`, [ tvalIds ]);


    res.forEach( row => {

        
        const ucard = ucards.find(c=>c.user.id==row.uid);  

        if( !ucard.utags.tags.find(t=>t.id==row.tagid) )
        {
            ucard.utags.tags.push({
                id: row.tagid,
                name: row.name
            });
        }

        ucard.utags.values = ucard.utags.values.map( tid=>{

            if( isNaN(tid) ) return tid; //<--- it means we already filled this data.

            const tagRow = res.find(r=>r.id==tid);

            if(!tagRow)
            {
                return null;
            }
            
            return {
                id: tid,
                tagid: tagRow.tagid,
                type: tagRow.type,
                value: tagRow.value
            }
        } )
        .filter( tval=>tval!==null)

    });
}