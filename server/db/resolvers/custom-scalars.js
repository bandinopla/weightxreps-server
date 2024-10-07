import { GraphQLScalarType } from "graphql";
import { dateASYMD } from "../../utils/dateASYMD.js";


export const CustomScalarsResolver = {
    /**
     * un type que usa una string como fecha UTC
     */
         UTCDate: new GraphQLScalarType({
            name        : "UTCDate",
            description : 'A string. The result of a `(new Date()).toUTCString()`',
    
            serialize       : value => {

                if( typeof value == 'string' ) 
                {
                    value = new Date(value)
                }

                if( !isDate(value) )
                {
                    throw new UserInputError(`Invalid date`);
                }

                return value.toUTCString()
            },
            parseValue      : value => {
                
                let d = new Date(value);
    
                if( d.toUTCString()==value )
                {
                    return d;
                }
            
                throw new UserInputError(`Invalid date, must be the product of a date.toUTCString()`);
            } 
        }), 
    
        YMD:  new GraphQLScalarType({
            name        : "YMD",
            description : 'A valid YYYY-MM-DD date (UTC) string... Ex: "2030-01-23"',
    
            // puede que sea un date. 
            serialize       : value => typeof value=='string'? value : dateASYMD(value, true),

            // el valor que entra desde un json... convertirlo a lo que usa el backend
            parseValue      : value => {
    
                let ymd = String(value);
                
                if( ymd.match(/^\d{4}-\d{2}-\d{2}$/) ) 
                {
                    const [year, month, day] = dateString.split('-').map(Number);

                }
    
                throw new UserInputError("Invalid date! must be YYYY-MM-DD");
    
            } 
        }), 

        YYYYMMDD: new GraphQLScalarType({
            name            : "YYYYMMDD",
            description     : 'YMD with just numbers... Ex: 20300112',
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

function isDate(value) {
    return Object.prototype.toString.call(value) === '[object Date]';
}