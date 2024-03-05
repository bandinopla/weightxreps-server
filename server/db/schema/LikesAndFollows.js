import { gql } from "apollo-server-express";



const $types = gql`

    type FollowersCount {
        total:Int! 
        has:Boolean
    }

    extend type Query {
        getFollowersCount(uid:ID!, has:ID):FollowersCount! @UserMustAllow
        getFollowing(uid:ID!):[User] @UserMustAllow
        getFollowers(uid:ID!):[User] @UserMustAllow
    }

    extend type  Mutation {
        likeMessage( target:ID! ):ID! @auth
        likeJournalLog( target:ID! ):ID! @auth
        follow(uid:ID!, not:Boolean):Boolean @auth @UserMustAllow
    }
`;

export default $types;