import { ename2type } from "../../utils/ename2type";
import extractUserDataFromRow from "../../utils/extractUserDataFromRow";
import { lb2kg } from "../../utils/lb2kg";
import { query as execQuery } from "../connection.js";

const MAX_ITEMS_PER_PAGE = 20;

//#region query parsing
 
const keys = {
    YMD: /(?:19|20)\d{2}(?:-\d{2}(?:-\d{2})?)?/,
    W: /\d+(?:\.\d+)?/,
    WUnit: /kg|lbs?/,
    N:/\d+/
}

const reg = parts => {
    let regexp = "";

    parts.forEach( part => {
        let [ gname, key ] = part.split(":");
        if( !key ) {
            key = gname;
            gname=null;
        }
        if( keys[key] )
        {
            regexp += "\\s*" + `(${gname?"?<"+gname+">":""}${keys[key].source})` ;
        }
        else 
        {
            regexp += "\\s*" + key;
        }
    }); 

    return new RegExp("^"+regexp);
}

const tokens = [

    // Date....
    {
        variants: [
            { reg:reg(["from:YMD","~","to:YMD"]), then: m=>({ from: m.groups.from, to:m.groups.to }) },  
            { reg:reg(["YMD"]), then: m=>({ from: m[0] }) }, 
            
        ],
        then: s => { // normalized token value
            return {
                ...s,
                type: "ymd"
            }
        }
    }, 
    
    // Weight x Reps...
    {
        variants: [
            { reg:reg(["weight:W",               "x", "reps:N", "x", "sets:N" ]), then: m=>m.groups }, 
            { reg:reg(["weight:W", "unit:WUnit", "x", "reps:N", "x", "sets:N" ]), then: m=>m.groups }, 
            { reg:reg(["weight:W",               "x", "reps:N" ]), then: m=>m.groups },  
            { reg:reg(["weight:W", "unit:WUnit", "x", "reps:N" ]), then: m=>m.groups },  
            { reg:reg(["weight:W", "unit:WUnit" ]), then: m=>m.groups },  
        ],
        then: s => {
            return {
                ...s,
                type:"wxr"
            }
        }
    },

    //username
    {
        variants:[
            {
                reg:/^@(?<uname>\S+)/, then: m=>m.groups
            }
        ],
        then: s=> {
            if( s.uname.indexOf(",")>0 )
            {
                return s.uname.split(",").map( uname=>({
                    uname: uname.trim(),
                    type:"uname"
                }))
            }

            return {
                ...s, type:"uname"
            }
        }
    }
]; 

function queryToTokens( query, segments )
{
    segments ??= [];

    if( !query.length ) return segments;

    for (let j = 0; j < tokens.length; j++) {
        const token = tokens[j];

        for (let i = 0; i < token.variants.length; i++) {
            const variant = token.variants[i];
            const m = query.match(variant.reg);
             
            if( m )
            {
                const s = variant.then(m);
                const tokenResult = token.then( s );
 
                if( Array.isArray(tokenResult) )
                {
                    segments.push( ...tokenResult ); 
                } 
                else 
                {
                    segments.push( tokenResult ); 
                }
                
                
                return queryToTokens( query.substr( m.index + m[0].length), segments);;
            }
        } 
    }

    const l = query.substr(0,1); 
    let last = segments[ segments.length-1 ];

    if( (!last || last.type!=="ename") ) {

        if( l !==" ")
        {
            last = { ename:l, type:"ename" }
            segments.push( last )
        } 
    }
    else 
    {
        if( l=="," ) // the comma only works when listing exercise names.
        {
            if( last.ename!=="" )
            {
                last = { ename:"", type:"ename" }
                segments.push( last )
            }
        }
        else 
        {
            last.ename += l;
        } 
        
    } 

    return queryToTokens( query.substr(1), segments );
}
  
function searchParams( query ) {
    const params = queryToTokens( query );
    const options = []; 
 
    params.forEach( (param,i) => {
        const prev = params[ i-1 ];
        let option = options[ options.length-1 ]; 

        if( !option )
        {
            option = {};
            option[ param.type ] = param;
            options.push( option );
            return;
        }

        //array mode...
        if( prev?.type == param.type ) {
            if( !Array.isArray( option[ param.type ]))
            {
                option[ param.type ] = [ option[ param.type ], param ];
            }
            else 
            {
                option[ param.type ].push( param );
            }
        }
        else // new type... 
        {
            if( option[param.type] )
            {
                let ymd = option.ymd;

                //ya hay uno... crear nueva opcion
                option = {
                    ymd
                };
                option[ param.type ] = param;
                options.push( option );
 
            }
            else 
            {
                option[param.type] = param;
            }
        }

    });

    return options;
}
 
function completeDate(YMD, floor) {
    const parts = YMD.split('-');
    const year = parseInt(parts[0], 10);
    const month = parts[1] ? parseInt(parts[1], 10) : (floor ? 1 : 12);
    const day = parts[2] ? parseInt(parts[2], 10) : 
        (floor ? 1 : new Date(year, month, 0).getDate());

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
//#endregion

export const SearchResolver = {
    Query: {
        search: async ( _, { query, page = 1 }, context )=> {
            const LIMIT = MAX_ITEMS_PER_PAGE; 
            const OFFSET = (page - 1) * LIMIT; 

            const searchOptions = searchParams( query ); 
            const options = [];
            const queryParams = []; 
            const myUID = context.session?.id;  
 
            //
            // convert the seachOptions to the format used by the mysql library.
            //
            searchOptions.forEach( option=>{

                const opts = [];

                if( option.ymd )
                {
                    if( option.ymd.to )
                    {
                        opts.push(`(logs.fecha_del_log BETWEEN ? AND ?)`);
                        queryParams.push( completeDate( option.ymd.from, true ) );
                        queryParams.push( completeDate( option.ymd.to, false ) );
                    }
                    else 
                    {
                        let d = completeDate( option.ymd.from, true );

                        if( d!=option.ymd.from )
                        {
                            opts.push(`(logs.fecha_del_log BETWEEN ? AND ?)`);
                            queryParams.push( d );
                            queryParams.push( completeDate( option.ymd.from, false ) );
                        }
                        else 
                        {
                            opts.push(`logs.fecha_del_log=?`);
                            queryParams.push( option.ymd.from );
                        } 
                    }
                    
                }  
                
                if( option.uname )
                {
                    if( Array.isArray( option.uname ) )
                    {
                        opts.push(`(users.uname IN (?) )`);
                        queryParams.push( option.uname.map(o=>o.uname) );
                    }
                    else 
                    {
                        opts.push(`users.uname = ?`);
                        queryParams.push( option.uname.uname );
                    }
                }
                
                if( option.ename )
                {
                    if( Array.isArray( option.ename ) )
                    {
                        //MATCH(ex.name) AGAINST('"A A" "B B" "C C"' IN BOOLEAN MODE)
                        opts.push(`MATCH(exercises.nombre) AGAINST(${ option.ename.map(e=>"?").join(" ") } IN BOOLEAN MODE)`);
                        queryParams.push( ...option.ename.map(o=>o.ename) );
                    }
                    else 
                    {
                        opts.push(`MATCH(exercises.nombre) AGAINST(?)`);
                        queryParams.push( option.ename.ename );
                    }
                }

                if( option.wxr )
                {
                    if( !Array.isArray(option.wxr) )
                    {
                        option.wxr = [option.wxr];
                    }

                    opts.push(  "(" +
                                option.wxr.map( set => {

                                    //
                                    // I stored the value as FLOAT in the db... 
                                    //
                                    let w = set.unit && (set.unit!="kg") ? Math.floor(lb2kg(Number(set.weight))*1000)/1000 : Number(set.weight); 
                                    const setParams = [
                                        "erows.wkg BETWEEN ? AND ?"
                                    ];
                                    queryParams.push( w-0.1 );
                                    queryParams.push( w+0.1 ); // anyone knows a better way to do this?

                                    if( set.reps ) {
                                        setParams.push("erows.reps=?");
                                        queryParams.push( set.reps );

                                        if( set.sets )
                                        {
                                            setParams.push("erows.sets=?");
                                            queryParams.push( set.sets );
                                        }
                                    } 

                                    return "("+ setParams.join(" AND ") + ")";
 

                                }).join(" OR ")
                                + ")"
                    );
                }

                options.push( opts.join(" AND ") );

            });

            const sql = `SELECT exercises.nombre as ename,  
                                logs.fecha_del_log, 
                                erows.*,
                                users.*
                            FROM erows 
                            JOIN exercises ON exercises.id=erows.eid 
                            JOIN logs ON logs.id=erows.logid 
                            JOIN users ON users.id=erows.uid AND (users.private=0 ${ myUID? " OR users.id="+myUID : "" })
                            
                            WHERE (${ options.join(") OR (") })

                            ORDER BY logs.fecha_del_log DESC
                            LIMIT ${LIMIT} OFFSET ${OFFSET}
                                `;

            const result = await execQuery(sql, queryParams);
            const referencedUsers = [];
            const referencedExercises = [];
            const results = result.map( row=>{

                const user = extractUserDataFromRow( row );
                const exercise = {
                    id: row.eid,
                    name: row.ename, 
                    type: ename2type(row.ename)
                }

                if(!referencedUsers.find(u=>u.id==user.id)) referencedUsers.push( user );
                if( !referencedExercises.find(e=>e.id==exercise.id)) referencedExercises.push( exercise );

                return {
                    exercise: exercise.id,
                    user: user.id,
                    ymd: row.fecha_del_log,
                    weight: row.wkg,
                    reps: row.reps, 
                    sets:row.sets,
                    inlbs: row.inlbs==1
                }

            });
 
            return {
                results,
                referencedUsers,
                referencedExercises,
                page
            }
        }
    }
}