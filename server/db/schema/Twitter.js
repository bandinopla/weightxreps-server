import gql from "graphql-tag";

const TWITTER_SCHEMA = gql` 

  enum TweetType {
    AS_DONATION,
    AS_DONATION2
  }

  type TweetChallenge {

    type: TweetType!
    title: String!
    description: String!  

  }


  type TweetState {
    type: TweetType!
    tweet: ID! 
    fecha: UTCDate!
    granted: Boolean
    status: String
    tweet_username: String
  }

  extend type Query {   
    getTwitterChallenges:[TweetChallenge]
    getTwitterChallengesStates:[TweetState] @auth
  }

  extend type Mutation {
    setTweet( id:ID, type:TweetType ):Boolean @auth
    deleteTweet( id:ID ):Boolean @auth
  }
`;

export default TWITTER_SCHEMA;