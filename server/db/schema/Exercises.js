import { gql } from "apollo-server-express";




const $types = gql` 

    """
    Total days and reps done by this exercise
    """
    type ExerciseStat {
        e:Exercise!
        days:Int!
        reps:Int!
    }

    """
    A message that the user should read before an action will execute.
    """
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


    """
    Personal records of this particular exercise and stats
    """
    type PRHistory {
        exercise:Exercise!
        totalWorkouts:Int! 

        """
        How many sets of X reps were performed by this exercise? (Like... how many singles or triples)
        """
        setsOf:[RepStat]
        prs:[PR]

        """
        Records related to Weight for Distance or Time. This feature was added later that's why it is separated like this.
        """
        wxdotPRS:WxDOTPRs
    }

    """
    Records related to using (W)eight for (D)istance (O)r (T)ime. 
    """
    type WxDOTPRs {
        erows: [Set]
        ymds: [YMD]

        """
        Links \`y = erows[i]\` --> \`ymds[y]\` so you know when the erow was done. 
        """
        erowi2ymdi:[Int] 
 
        minDistancePR:[Int]
        maxDistancePR:[Int]
        maxTimePR:[Int]
        minTimePR:[Int]
        speedPR:[Int]
        maxForcePR:[Int]

        """
        Weight for distance PRs
        """
        WxD_PRs:[Int]

        """
        Weight for time PRs
        """
        WxT_PRs:[Int]

        """
        Distance for time PRs. (Ex: goal is either increase or decrease distance over time)
        """
        DxTPR:[Int]
    }

    """
    Weight for Distance PR
    """
    type WxDPR { 
        w:Float
        lb:Int

        """
        Weight added to the user's bodyweight
        """
        a2bw:Float 
        d:Float!
        dunit:String!
        t:Float
        when:YMD!
    } 

    """
    How many sets were done of this many reps.
    """
    type RepStat {
        r:Int!

        """
        Total sets done using this rep range.
        """
        count:Int!
    }

    type PR {
        w:Float!
        r:Int!
        lb:Int!
        when:YMD!
        bw:Float

        """
        how much weight was added to the bodyweight (if any)
        """
        a2bw:Float
    }

    extend type Query {  

        """
        Get all the exercises of this user id (uid)
        """
        getExercises(uid:ID!):[ExerciseStat] @UserMustAllow

        """
        Get all personal record of this exercise
        """
        getPRsOf(
            """
            ID of the exercise
            """
            eid:ID!, 

            """
            Up until this date inclusive.
            """
            till:YMD
            ):PRHistory @UserMustAllow
    }

    extend type Mutation {

        #
        # sin id, es NEW
        # con id es EDIT
        # con id y sin name es DELETE
        #
        execExercise( id:ID, name:String, confirms:ID ):ExecExerciseResponse @auth @oauth(scope:"jwrite")
        execBulkExercises ( eids:[ID!]!, mode:BulkMode! ):Boolean @auth @oauth(scope:"jwrite")
    }
`;

export default $types;