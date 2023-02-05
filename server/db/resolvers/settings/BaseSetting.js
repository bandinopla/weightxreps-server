

export class BaseSetting {

    constructor( id, __typename, mustBeVerified = false )
    {
        this.id = id;
        this._mustBeVerified = mustBeVerified;
        this.__typename = __typename;
    } 

    get mustBeVerified() {
        return this._mustBeVerified;
    }


    async getSetting( userInfo ) {  
        return this.__asSetting({});
    }
 

    __asSetting(o) {
        return {
            __typename: this.__typename,
            id:this.id,
            waitingCodeToChange:false,
            ...o
        }
    }

    asPending(o={}) {
        return this.__asSetting({
            ...o,
            waitingCodeToChange: true
        });
    }


    input2value(v) {
        return v;
    }
 
}