import gql from "graphql-tag";

const $types = gql` 

  type Achievement {
    id:ID!
    name:String!
    description:String!
  }

  type AchievementState {
    aid:ID!
    gotit:Boolean
    when:YYYYMMDD
    note:String
  }
 

  extend type Query {  
    getAchievementsStateOf( uid:ID!, asOfThisYMD:YYYYMMDD! ):[AchievementState] 
    getAchievements:[Achievement]
  }
`;

export default $types;