import gql from "graphql-tag";

const $types = gql`
  type EblockPreview {
    e:Exercise! 
    w:Float 
    r:Int
  }

  type UCard {
    user:User 
    posted:String
    when:String
    text:String
    media:String
    workoutPreview:[EblockPreview]
    andXmore:Int
    itemsLeftAfterThis:Int
    utags:UTagsUsed
  }

  enum ActivityFeedType {
    global
    following
  } 

  extend type Query {  
    getActivityFeed( type:ActivityFeedType!, olderThan:String, newerThan:String ):[UCard] 
  }
`;

export default $types;