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
    avatarhash:String! #avatar hash, timestamp del avatar del usuario...
    uname:String!
    cc:String
    slvl:Float
    sok:Int
    age:Int
    bw:Float
    private:Int
    isf:Int
    joined:String
    usekg:Int

    custom1RM:Int       # si tiene custom factor para las 1RM calculations 
    est1RMFactor:Int    # el factor que usa ( custom | defaultFactor )
    jranges:[Int] # si puede meter mas zoom
    estimate1RMFormula:String  #formula para hacerle eval(estimate1RMFormula)

    socialLinks:[String] #Array de strings a urls de sus social sites...
  }

  type Exercise {
    id:ID!
    name:String!
    type:String
  }

  type Weight {
    v:Float!
    lb:Int!
  }

#   enum OfficialLift {
#     SQ
#     BP
#     DL
#   }

  type Query {  
    totalJournals:Int!
  } 

  type Mutation {
    _:String
  } 
`;
  
 
const schema = makeExecutableSchema({ 
  typeDefs: [ 
              AccessRestrictionDirective
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
            //, TestSubscription
          ]

  , resolvers: Resolvers 
}); 


export default AccessRestrictionSchemaTransformer(
                  UserInfoSchemaTransformer(schema)
                );
