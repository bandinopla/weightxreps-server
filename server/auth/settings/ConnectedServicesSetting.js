 
import { BaseSetting } from "../../db/resolvers/settings/BaseSetting";
import { getConnectedClientsTo, revokeClientsFrom } from "../model";
import { ConnectedServicesSettingName } from "./graphqlSettingTypeDefs";
 
 

export class ConnectedServicesSetting extends BaseSetting {
    constructor() {
        super("connected-services", ConnectedServicesSettingName, false);
    }

    async getSetting( userInfo ) {  

        let connections = await getConnectedClientsTo(userInfo.id);
         
  
        return this.__asSetting({ 
            connections
        });
    }

    async setValue( userInfo, value ) {
 
        if( value.revoke ) //<-- expects an array of IDs
        { 
            let connections = await revokeClientsFrom(userInfo.id, value.revoke);

            return this.__asSetting({ connections }); 
        }
        
        throw new Error("Invalid setting value")
    }
}