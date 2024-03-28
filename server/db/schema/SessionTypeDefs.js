import gql from "graphql-tag";

const $types = gql`
  type SessionInfo {
    user:User! 
    time:String
    forum:ForumStatus
  }  

  extend type Query {
    getSession:SessionInfo 
  }

  extend type Mutation { 
    login( u:String!, p:String! ):String! 
    loginWithGoogle( jwt:String!, uname:String, isf:Int, usekg:Int ):String!
    loginWithFirebase( token:String!, uname:String, isf:Int, usekg:Int ):String! 
    forgot( uore:String! ):Boolean!
    signup( uname:String!, email:String!, pass:String!, isf:Int!, usekg:Int! ):Boolean!
    verifySignup( code:String! ):String! #--- devuelve el session token para que el front haga login
  }
`;

export default $types;