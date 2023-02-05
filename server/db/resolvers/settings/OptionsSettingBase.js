import { BaseSetting } from "./BaseSetting.js";


export class OptionsSettingBase extends BaseSetting {

    constructor( options, id, graphType, allowsNullOption=false, mustConfirm=false ) 
    {
        super( id, graphType, mustConfirm )
        this.options = options;
        this.allowsNullOption = allowsNullOption;
    }

    // NO OVERRIDE
    input2value(v) 
    {  
        var i = parseInt(v);

        if( i==null && this.allowsNullOption )
        {
            return;
        }

        if( isNaN(i) || i<0 || i>this.options.length-1 )
        {
            throw new Error( "Invalid option... Available options: "+this.options.length+", But you chose "+( isNaN(i)?" this ---> "+String(i) : i.toString() ) );
        } 

        return i;
    }

    // NO OVERRIDE
    async getSetting( userInfo, firstTime = false) {
 
        return this.__asSetting({  
            i: await this.__getSettingCurrentValue( userInfo )

            , options: firstTime? this.options.map( (opt,i)=>({
                i,
                name: this.__getOptionLabel( opt )
            }) ) : null
        });
    }

    /**
     * @override
     * @return {string}
     */
    __getOptionLabel( option ) {
        throw new Error("__getOptionLabel not implemented yet...")
    }

    /**
     * @override
     * @returns {number} El index de la opcion
     */
     async __getSettingCurrentValue( userInfo ) 
    {
        throw new Error("__getSettingCurrentValue not implemented yet...")
    }

    /**
     * @override
     */
    async __setValue(  userInfo, newValue )
    {
        throw new Error("__setValue not implemented yet...")
    }


    async setValue( userInfo, newValue )
    {   
        const option =  newValue==null ? null : this.options[ newValue ];

        // si no tira error, salio todo bien.
        await this.__setValue( userInfo, newValue );

        return this.__asSetting({
            i: newValue
        });
    }
}