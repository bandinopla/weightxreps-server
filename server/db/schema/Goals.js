import { gql } from "apollo-server-express";

const $types = gql`

enum GoalType {
  WEIGHT_X_REPS    # 0: Weight x Reps
  WEIGHT_X_TIME     # 1: Weight x Time
  WEIGHT_X_DISTANCE # 2: Weight x Distance [ x Time ] 
}


type UserGoal {
    id: ID!
    name: String!
    uid: ID!
    exercise:Exercise!
    creationDate: YMD! 
    maxDate: YMD!
    completionDate: YMD   # Nullable, because it's nullable in the table
    type: GoalType! 
    weight: Float!
    distance: Int!
    reps: Int!
    time: Int!
    sets: Int!
    comment: String
    dUnit:String # Enum values: 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'
    tGoalFaster:Boolean # true = less time is better than more time.
    
    plannedProgress:[Float!]! #each item in the list represents a day...
    progress:[Float] # actual progress...
    options:String # suggested possible options for the current day to be on plan...
}

extend type Query {
    getGoals( uid:ID!, upToDate:YMD ):[UserGoal] @UserMustAllow
}

extend type Mutation {
    setGoal( name:String, eid:ID!, ename:String, startDate:YMD!, type:Int, weight:Float, reps:Int, time:Int, distance:Int, sets:Int, dUnit:String, plannedProgress:[Float!]!, comment:String ):ID @auth @oauth(scope:"goals")
    deleteGoal( id:ID! ):Boolean @auth @oauth(scope:"goals")
}
`;


export default $types;