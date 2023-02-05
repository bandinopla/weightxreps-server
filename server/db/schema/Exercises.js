import { gql } from "apollo-server-express";




const $types = gql` 
    type ExerciseStat {
        e:Exercise!
        days:Int!
        reps:Int!
    }

    type ConfirmAction {
        message:String!
        id:ID!
    }

    enum BulkMode {
        DELETE 
        MERGE
    }

    union ExecExerciseResponse = Exercise | ConfirmAction

    #-------------------------


    type PRHistory {
        exercise:Exercise!
        totalWorkouts:Int! 
        setsOf:[RepStat]
        prs:[PR]  
        
    }

    type RepStat {
        r:Int!
        count:Int!
    }

    type PR {
        w:Float!
        r:Int!
        lb:Int!
        when:YMD!
        bw:Float
    }

    extend type Query {  
        getExercises(uid:ID!):[ExerciseStat] @UserMustAllow
        getPRsOf(eid:ID!, till:YMD):PRHistory @UserMustAllow
    }

    extend type Mutation {

        #
        # sin id, es NEW
        # con id es EDIT
        # con id y sin name es DELETE
        #
        execExercise( id:ID, name:String, confirms:ID ):ExecExerciseResponse @auth
        execBulkExercises ( eids:[ID!]!, mode:BulkMode! ):Boolean @auth
    }
`;

export default $types;