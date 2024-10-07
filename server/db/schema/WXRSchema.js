import gql from "graphql-tag";
import { makeExecutableSchema } from '@graphql-tools/schema';
import SessionTypeDefs from "./SessionTypeDefs.js";
import { Resolvers } from "../Resolvers.js";
import ActivityFeedTypes from "./ActivityFeedTypes.js";
import InboxTypes from "./InboxTypes.js";

import { AccessRestrictionDirective, AccessRestrictionSchemaTransformer } from "../directives/AccessRestrictionDirective.js";
import LikesAndFollows from "./LikesAndFollows.js";
import JournalDay from "./JournalDay.js";
import { UserInfoDirective, UserInfoSchemaTransformer } from "../directives/uid-must-allow.js";
import Exercises from "./Exercises.js";
import CommunityStats from "./community-stats.js";
import { UploadTypedef } from "../uploader/upload-handler.js";
import Settings from "./Settings.js";
import Support from "./Support.js";
import Achievements from "./Achievements.js";
import Videos from "./Videos.js";
import TWITTER_SCHEMA from "./Twitter.js";
import TAGS from "./tags.js";
import FORUM, { ForumRolesDocMarkup } from "./forum.js";
import { OAuthDirective, OAuthDirectiveSchemaTransformer } from "../../auth/oauthGraphQLDirective.js";
import { JS_1RM_FORMULA } from "../resolvers/exercises.js";

const baseTypeDefs = gql`

  enum CacheControlScope {
    PUBLIC
    PRIVATE
  }

  directive @cacheControl(
    maxAge: Int
    scope: CacheControlScope
    inheritMaxAge: Boolean
  ) on FIELD_DEFINITION | OBJECT | INTERFACE | UNION

  type User {
    id:ID!

    """
    Hash to add to the avatar url...
    """
    avatarhash:String! 

    """
    Username
    """
    uname:String!

    """
    Country code
    """
    cc:String

    """
    Supporter Level
    """
    slvl:Float

    """
    Active supporter? 1 = true
    """
    sok:Int

    """
    Days left as active supporter
    """
    sleft:Int
    age:Int
    bw:Float
    private:Int

    """
    Is Female? 0 | 1
    """
    isf:Int
    joined:String

    """
    Prefered weight unit. 1= Uses Kilograms. 0=Uses Pounds
    """
    usekg:Int

    """
    Custom \`factor\` for the 1RM formula. Which is: \n \`\`\`${JS_1RM_FORMULA}\`\`\`
    """
    custom1RM:Int 

    """
    See above, but this is the system's DEFAULT value.
    """
    est1RMFactor:Int    # el factor que usa ( custom | defaultFactor )


    """
    Ranges that the calendar's zoom UI has available. Used by the caldendar widget.
    """
    jranges:[Int] # si puede meter mas zoom

    """
    Javascript version of the 1RM forumyla to be used by the frontend using \`eval(estimate1RMFormula)\`
    """
    estimate1RMFormula:String 

    """ 
    ${ForumRolesDocMarkup}
    """
    forumRole:ForumRoleKey 

    """
    URLs of social media or whatever...
    """
    socialLinks:[String] #Array de strings a urls de sus social sites...


    email:String @auth @oauth(scope:"email2", action:REPLACE, replacement:"not_allowed_by_scope")
  }

  type Exercise {
    id:ID!
    name:String!

    """
    If it is an "official" exercise, this is the TAG. 
    """
    type:String
  }

  type Weight {
    """
    Value of the weight (in kilograms)
    """
    v:Float!

    """
    1 = If the weight is meant to be displayed as pounds.
    """
    lb:Int!
  } 

  type Query {  
    totalJournals:Int!
  } 

  type Mutation {
    _:String
  } 
`;
  
 
var schema = makeExecutableSchema({ 
  typeDefs: [ 
              AccessRestrictionDirective
            , OAuthDirective
            , UploadTypedef
            , UserInfoDirective
            , baseTypeDefs
            , InboxTypes
            , SessionTypeDefs 
            , ActivityFeedTypes
            , LikesAndFollows
            , JournalDay
            , Exercises
            , CommunityStats
            , Settings
            , Support
            , Achievements
            , Videos
            , TWITTER_SCHEMA
            , TAGS
            , FORUM
            //, TestSubscription
          ]

  , resolvers: Resolvers 
}); 


schema = UserInfoSchemaTransformer(schema);
schema = AccessRestrictionSchemaTransformer( schema );
schema = OAuthDirectiveSchemaTransformer( schema );

export default schema;
