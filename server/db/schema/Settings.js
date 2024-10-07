import gql from "graphql-tag";
import { oauthSettingTypeDefs, oauthSettingTypeNames } from "../../auth/settings/graphqlSettingTypeDefs";

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
    currentEmail:String! @oauth(scope:"email",action:REPLACE, replacement:"----")
    ${$SettingFields}
  }

  type VoidSetting implements Setting {
    ${$SettingFields}
  }

  type DOBSetting implements Setting {
      dob:YMD
      ${$SettingFields}
  }

  """
  Country code : ISO 3166-1 alpha-2 ( 2 letters )
  """
  type CC {
      """
      country code
      """
      cc:ID!

      """
      Name of the country
      """
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
   
  ${ oauthSettingTypeDefs($SettingFields) }

  union UserSetting = UsernameSetting | EmailSetting | VoidSetting | DOBSetting | CCSetting | OptionSetting | SupporterStatus | Custom1RMFactorSetting | RPESetting | DeleteAccountSetting | BlockUsersSetting | SocialMediasSetting | ${oauthSettingTypeNames.join("|")}

  extend type Query {
      getUserSettings:[UserSetting]! @auth @no_oauth @needsUserInfo
      
  }
  extend type Mutation { 

    """
    Uploads an image to be used as the avatar for the currently logged in user.
    """
    uploadAvatar(file: Upload!): String! @auth @oauth(scope:"avatar")

    """
    Removes the avatar from the currently logged in user.
    """
    deleteAvatar: Boolean @auth @oauth(scope:"avatar")

    """
    Used to set the value of a setting for the currenlty logged in user.
    """
    setSetting( id:ID!, value:SettingValue ):UserSetting @auth @needsUserInfo @no_oauth

    """
    Some settings, when changed, send a code to the user's email, then that code has to be used here to confirm the change of the setting.
    """
    sendVerificationCode( 
        """
        ID of the setting
        """
        id:ID!, 
        """
        The verification code
        """
        code:String! ):UserSetting @auth @needsUserInfo @no_oauth

    """
    When the system sends an email, it provides a link at the bottom to unsub from recieving emails. That code is passed to this mutation to identify the user and remove the subscription.
    """
    unsubFromEmails( token:String ): Boolean @no_oauth
  }
`;

export default $types;