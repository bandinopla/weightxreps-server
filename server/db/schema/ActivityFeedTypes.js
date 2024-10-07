import gql from "graphql-tag";

const $types = gql`

  """
  Represents the preview of the workout done with this exercise
  """
  type EblockPreview {

    """
    The exercise used
    """
    e:Exercise! 

    """
    The max weight used
    """
    w:Float 

    """
    Reps done with that max weight
    """
    r:Int
  }

  """
  Represent a journal post's minimal data to show the user what it was done. A brief detail of the log.
  """
  type UCard {
    user:User 
    posted:YMD
    when:UTCDate
    text:String
    media:String
    workoutPreview:[EblockPreview]
    andXmore:Int
    itemsLeftAfterThis:Int
    utags:UTagsUsed
  }

  enum ActivityFeedType {
    """
    Every public journal
    """
    global

    """
    Only jorunals that the currently logged user is following
    """
    following
  } 

  extend type Query {  
    """
    Returns the activity of the users that fall in the context of \`type\` 
    """
    getActivityFeed( 
        """
        Type of feed to return
        """
        type:ActivityFeedType!, 

        """
        Results must be older than this date...
        """
        olderThan:UTCDate, 
        
        """
        Results must be newer than this date...
        """
        newerThan:UTCDate ):[UCard] 
  }
`;

export default $types;