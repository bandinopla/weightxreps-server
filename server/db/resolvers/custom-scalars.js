import { GraphQLScalarType } from "graphql";
import { dateASYMD } from "../../utils/dateASYMD.js";


export const CustomScalarsResolver = {
    /**
     * un type que usa una string como fecha UTC
     */
         UTCDate: new GraphQLScalarType({
            name        : "UTCDate",
            description : 'Timestamp...',
    
            serialize       : value => value.toUTCString(),
            parseValue      : value => {
                
                let d = new Date(value);
    
                if( d.toUTCString()==value )
                {
                    return d;
                }
            
                throw new UserInputError(`Invalid date, must be the product of a date.toUTCString()`);
            }
            // ,
            // parseLiteral    : ast => {
    
            //     if (ast.kind === Kind.STRING) {
            //         let d = new Date(ast.value);
    
            //         if( d instanceof Date && !isNaN(d) )
            //         {
            //             return d;
            //         }
            //     }
    
            //     throw new UserInputError("Invalid date");
            // }
        }), 
    
        YMD:  new GraphQLScalarType({
            name        : "YMD",
            description : 'YYYY-MM-DD date...',
    
            // puede que sea un date. 
            serialize       : value => typeof value=='string'? value : dateASYMD(value, true),

            // el valor que entra desde un json... convertirlo a lo que usa el backend
            parseValue      : value => {
    
                let ymd = String(value);
                
                if( ymd.match(/^\d{4}-\d{2}-\d{2}$/) ) 
                {
                    let d       = new Date( ymd.substr(0,4), Number(ymd.substr(5,2))-1, ymd.substr(8) );
                    let check   = (d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate()).toString();
    
                    if( ymd.replace(/-/g,"")==check )
                    {
                        return value;
                    }
                }
    
                throw new UserInputError("Invalid date! must be YYYY-MM-DD");
    
            }
            // ,parseLiteral    : ast => {
    
            //     if (ast.kind === Kind.STRING) {
    
            //         let ymd     = ast.value;
            //         let d       = new Date( ymd.substr(0,4), Number(ymd.substr(5,2))-1, ymd.substr(8) );
    
            //         if( d instanceof Date && !isNaN(d) )
            //         {
            //             return d;
            //         }
            //     }
    
            //     throw new UserInputError("Provided value is not a valid date");
            // }
        }), 

        YYYYMMDD: new GraphQLScalarType({
            name            : "YYYYMMDD",
            description     : 'YMD with just numbers...',
            serialize       : value => value,
            parseValue      : value => {
                
                let ymd = String(value);
                
                if( ymd.match(/^\d{8}$/) ) 
                {
                    let d       = new Date( Date.UTC( ymd.substr(0,4), Number(ymd.substr(4,2))-1, ymd.substr(6) ));
                    let check   = (d.getUTCFullYear()*10000 + (d.getUTCMonth()+1)*100 + d.getUTCDate()).toString();
                    
                    if( check==ymd )
                    {
                        return String(value);
                    } 
                }
    
                throw new UserInputError("Invalid date! must be YYYYMMDD (no symbols in between the numbers)");
            }
        }),
}