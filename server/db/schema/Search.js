import gql from "graphql-tag";

const $types = gql`
  type SearchResult {
    user:ID! 
    ymd:YMD!
    exercise:ID!
    weight:Float!
    reps:Int!
    sets:Int!
    inlbs:Boolean!
  }  

  type SearchResults {
    results:[SearchResult!]
    referencedUsers:[User!]
    referencedExercises:[Exercise!]
    page:Int!
  }

  extend type Query {
    search( query:String!, page:Int ):SearchResults @no_oauth @needsUserInfo
  }
 
`;

export default $types;