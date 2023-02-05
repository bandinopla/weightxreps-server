import { query, transaction } from "../../connection.js";
import { BaseSetting } from "./BaseSetting.js";


export class RPESetting extends BaseSetting {

    constructor()
    {
        super("rpe", "RPESetting"); 
    } 

    /**
     * v es un array del patron  REP, RPE, PERCENT
     * REP = Int
     * RPE = Int 6-10 y como fraccion solo se permite .5
     * PERCENT entre 10 y 100
     * --
     * el usuario solo cambia el percent... validar el resto no "debería" hacer falta.
     */
    input2value(v) { 

        // debe ser un array de numeros divisible por 3... [ rep, rpe, percent, ..., ..., ... ] repetido...
        if( !Array.isArray(v) || v.length%3 != 0)
        {
            throw new Error("Wrong setting value!");
        }  

        //
        // por cada valor del array
        //
        for (let i = 0; i < v.length; i++) 
        {
            const val   = v[i];
            const propi = i%3;

            if( isNaN(val) )
            {
                throw new Error( "Only numbers are expected, but this is not a number ---> "+ val );
            }

            //
            // REP validation
            //
            if( propi==0 && ((val!=Math.round(val)) || val<1 || val>12 ))
            {
                throw new Error("Reps must be round numbers between 1 and 12");
            }

            //
            // RPE validation
            //
            else if( propi==1 && (
                            // no es un entero, o es una fraccin pero no es .5
                            !((val==Math.floor(val)) || (val==Math.floor(val)+0.5)) 
                            || val<6 
                            || val>10 
                            )
               )
            {
                throw new Error("RPE must be between 6 and 10, and only .5 fractions.")
            }

            //
            // PERCENT
            //
            else if( propi==2 && ( val>0 && (val<0 || val>1)) )
            {
                throw new Error("Percentages must be in the range of 10% to 100%")
            }   
        }

        return v;
    }

    __reduce(out, row){
        return [
            ...out,
            row.rep,
            row.rpe,
            row.percent
        ]
    }

    async getSetting( userInfo ) {

        const urow = await query(`SELECT rep, rpe, percent, false AS isDefault FROM rpe_override WHERE uid=?
                                    UNION
                                  SELECT rep, rpe, percent, true AS isDefault FROM rpe;`, [ userInfo.id ]);

        return this.__asSetting({  

            defaults    : urow.filter(r=>r.isDefault).reduce( this.__reduce, [] ), 
            overrides   : urow.filter(r=>!r.isDefault).reduce( this.__reduce, [] )

        });
    }

    async setValue( userInfo, newValue )
    { 
        //const res = await query(`UPDATE users SET email=? WHERE id=?`, [ newValue, userInfo.id ]);

        const currentValue      = await this.getSetting(userInfo);

        //
        // current overrides... [ rep, rpe, percent, rep, rpe, percent, ... ]
        //
        const overrides         = currentValue.overrides; //<-- [ rep, rpe, percent, ... ]

        //borrar lo que haya... e insertar lo nuevo...
        const tran = await transaction(); 

        await tran.query(`DELETE FROM rpe_override WHERE uid=?`,[ userInfo.id ]); 

        console.log("NEW VALUES", newValue)
 
        newValue.forEach( (val, i, narr)=>{

            var prop = i%3;

            if( prop==0 ) //update or add new override...
            {
                var updateIndex = overrides.findIndex( (v,j,arr)=> j%3==0 // por cada "chunk"
                                                                    && arr[j]==narr[i]  // same REP
                                                                    && arr[j+1]==narr[i+1] // same RPE 
                                                      );

                if( updateIndex<0 ) //<-- NEW OVERRIDE
                { 
                    overrides.push( narr[i],     //<-- REP
                                    narr[i+1],   //<-- RPE
                                    narr[i+2] ); //<-- Percent
                }
                else  // <--- UPDATING OLD VALUE
                {
                    overrides[ updateIndex+2 ] = narr[ i+2 ];
                }
            } 

        } );

        //
        // agregarlo a los overrides
        // 

        if( overrides.length )
        {
            const inserts = overrides.reduce( (out,v,i,arr)=>{

                if( i%3==0 )
                { 
                    if( arr[i+2]==0 ) // DELETE FLAG
                    {
                        return out; // skip this line
                    }

                    out.push( [
                        userInfo.id,    //<-- UID
                        v,              //<-- REP
                        arr[i+1],       //<-- RPE
                        arr[i+2]        //<-- PERCENT
                    ] );
                }

                return out;

            } ,[] );

            //console.log("INSERT", inserts)

            if( inserts.length )
            {
                await tran.query(`INSERT INTO rpe_override (uid, rep, rpe, percent) VALUES ?`, [ inserts ]);
            }
            //
        } 

        await tran.commit();

        return this.__asSetting({  
            overrides: newValue
        });
    }
 
}