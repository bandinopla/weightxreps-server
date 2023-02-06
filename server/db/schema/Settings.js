import gql from "graphql-tag";

const $SettingFields = `
    id:ID!
    waitingCodeToChange:Boolean
`;

const $types = gql`  

  scalar SettingValue #--- para que el front me puede mandar un object y en el resolver lo manejo sin necesidad de crearle un type.

  interface Setting {
      ${$SettingFields}
  }

  type EmailSetting implements Setting { 
    currentEmail:String!
    ${$SettingFields}
  }

  type VoidSetting implements Setting {
    ${$SettingFields}
  }

  type DOBSetting implements Setting {
      dob:YMD
      ${$SettingFields}
  }

  type CC {
      cc:ID!
      name:String!
  }
  
  type CCSetting implements Setting {
      cc:String
      ccs:[CC]
      ${$SettingFields}
  }

  type Option {
      i:Int!
      name:String!
  } 
  
  type OptionSetting implements Setting {
      i:Int #<--- puede ser null
      options:[Option]
      ${$SettingFields}
  }

  type SupporterStatus implements Setting{
      slvl:Float! 
      daysLeftAsActive:Int! 
      ${$SettingFields}
  }

  type Custom1RMFactorSetting implements Setting {
      factor:Int!
      formula:String
      default:Int!
      ${$SettingFields}
  }

  type RPESetting implements Setting {
    defaults:[SettingValue]
    overrides:[SettingValue]
    ${$SettingFields}
  }

  type DeleteAccountSetting implements Setting {
    signature:String
    ${$SettingFields}
  }

  type BlockUsersSetting implements Setting {
      unames:[String]
      ${$SettingFields}
  }

  type UsernameSetting implements Setting {
      uname:String!
      ${$SettingFields}
  }

  type SocialMediasSetting implements Setting { 
    links:[String]
    ${$SettingFields}
  }


  union UserSetting = UsernameSetting | EmailSetting | VoidSetting | DOBSetting | CCSetting | OptionSetting | SupporterStatus | Custom1RMFactorSetting | RPESetting | DeleteAccountSetting | BlockUsersSetting | SocialMediasSetting

  extend type Query {
      getUserSettings:[UserSetting]! @auth @UserMustAllow
      
  }
  extend type Mutation { 
    uploadAvatar(file: Upload!): String! @auth #--- deveulve el HASH
    setSetting( id:ID!, value:SettingValue ):UserSetting @auth @UserMustAllow
    sendVerificationCode( id:ID!, code:String! ):UserSetting @auth @UserMustAllow 
    
  }
`;

export default $types;