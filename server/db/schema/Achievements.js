import gql from "graphql-tag";

const $types = gql` 

  """
  A generic thing that was achieved. 
  """
  type Achievement {
    id:ID!
    name:String!
    description:String!
  }

  """
  Represents the state of an achievement for a particular user. 
  """
  type AchievementState {

    """
    ID of the achievement
    """
    aid:ID!

    """
    If it was achieved or not
    """
    gotit:Boolean
    when:YYYYMMDD

    """
    Details particular to this specific achievement
    """
    note:String
  }
 

  extend type Query {  

    """
    Returns all the achievements that this user has up to that particular date.
    """
    getAchievementsStateOf( uid:ID!, asOfThisYMD:YYYYMMDD! ):[AchievementState] 

    """
    Returns all the available achievements that the system recognizes/has.
    """
    getAchievements:[Achievement]
  }
`;

export default $types;