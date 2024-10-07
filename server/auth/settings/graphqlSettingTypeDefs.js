


//
// graphql stuff related to the structure of the setting data
//

export const ConnectedServicesSettingName = 'ConnectedServicesSetting';
export const DeveloperConfigSettingName = 'DeveloperConfigSetting';

export const oauthSettingTypeNames = [ConnectedServicesSettingName, DeveloperConfigSettingName];
export const oauthSettingTypeDefs = $SettingFields => `  

  type ConnectedService {
    id:String!
    name:String!
    url:String!
  }

  type ${ConnectedServicesSettingName} implements Setting { 
    connections:[ConnectedService!]
    ${$SettingFields}
  }

  type DeveloperService { 
    id:String!
    dbid:ID
    name:String!
    url:String! 
    redirectUris:[String!]!
    secret:String
  }

  type DevConfigChanges {
    hash:ID!
    changelog:String
  }

  type DeveloperConfig {
    confirmChanges:DevConfigChanges 
    services:[DeveloperService!]
  }

  type ${DeveloperConfigSettingName} implements Setting {
    config:DeveloperConfig!
    ${$SettingFields}
  }`;