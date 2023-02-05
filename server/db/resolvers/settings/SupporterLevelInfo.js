import { BaseSetting } from "./BaseSetting.js";


export class SupporterLevelInfo extends BaseSetting {

    constructor()
    {
        super("supstatus","SupporterStatus")
    }  

    async getSetting( userInfo ) {  


        return this.__asSetting({
            slvl                : userInfo.slvl, 
            daysLeftAsActive    : userInfo.daysLeft
        });
    } 

    input2value(v) {

        throw new Error("This setting doesn't take any values..."); 
    }
 
}