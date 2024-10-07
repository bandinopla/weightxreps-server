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
    login( u:String!, p:String! ):String! @no_oauth
    loginWithGoogle( jwt:String!, uname:String, isf:Int, usekg:Int ):String! @no_oauth
    loginWithFirebase( token:String!, uname:String, isf:Int, usekg:Int ):String! @no_oauth
    forgot( uore:String! ):Boolean! @no_oauth
    signup( uname:String!, email:String!, pass:String!, isf:Int!, usekg:Int! ):Boolean! @no_oauth

    """
    When a signup is made, a code is sent to the email. That code is then used here and the return will be a \`session token\`
    """
    verifySignup( code:String! ):String! @no_oauth #--- devuelve el session token para que el front haga login
  }
`;

export default $types;