import gql from "graphql-tag";

const $types = gql` 

  type Video {
    user:User!
    when:String!
    posted:String!
    link:String!
    logid:ID!
  } 

  extend type Query {  
    getVideos:[Video] 
  }
`;

export default $types;