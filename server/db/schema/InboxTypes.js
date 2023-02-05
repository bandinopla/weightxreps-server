import gql from "graphql-tag"; 
 

const INotificationFields = `
    id:ID!
    when:UTCDate!
`;

const IByFields       = `by:ID! `;
const IHasTextFields  = "text:String!"; 

const IHasJOwner      = `jowner:ID!
                         ymd:YMD!`;

const IHasMessageID   = `msgid:ID!`;
const IMessageRef     = `${IHasMessageID}
                         inResponseTo:ID
                         inResponseToMsg:ID`;

const IToFields        = "to:ID!";

const $types = gql`

  scalar UTCDate
  scalar YMD 

  interface INotification {
    ${INotificationFields}
  }

  interface IBy {
    ${IByFields}
  }


  interface ITO {
    ${IToFields}
  }

  interface IHasText {
    ${IHasTextFields}
  } 

  interface IHasJOwner {
    ${IHasJOwner}
  }

  interface IMessageRef {
    ${IMessageRef}
  }

  interface IHasMessageID {
    ${IHasMessageID}
  }

  type DM implements INotification & IBy & IHasText & IMessageRef & ITO {  
    ${INotificationFields} 
    ${IByFields}
    ${IToFields}
    ${IHasTextFields}
    ${IMessageRef}  
  } 

  type JComment implements INotification & IBy & IHasText & IMessageRef & ITO & IHasJOwner {     
    ${INotificationFields} 
    ${IByFields}
    ${IToFields}
    ${IHasTextFields}
    ${IMessageRef}  
    ${IHasJOwner}
  }    

  type LikeOnLog implements INotification & IBy & IHasJOwner{   
    ${INotificationFields}
    ${IByFields} 
    ${IHasJOwner}
  } 

  type LikeOnJComment implements INotification & IBy & ITO &  IHasJOwner & IHasMessageID & IHasText {   
    ${INotificationFields}
    ${IByFields} 
    ${IToFields}
    ${IHasJOwner} 
    ${IHasMessageID}
    ${IHasTextFields}
  }

  type LikeOnDM implements INotification & IBy & ITO  & IHasMessageID & IHasText {   
    ${INotificationFields}
    ${IByFields}  
    ${IToFields}
    ${IHasMessageID}
    ${IHasTextFields}
  }

  type StartedFollowing implements INotification & IBy & ITO {  
    ${INotificationFields}
    ${IByFields}
    ${IToFields}
  }

  enum SystemNotificationType {
    error 
    warning
    info
  }

  type SystemNotification implements INotification & IHasText { 
    type:SystemNotificationType 
    ${INotificationFields}
    ${IHasTextFields}
  } 


  union Notification = DM | JComment | LikeOnLog | LikeOnJComment | LikeOnDM | StartedFollowing | SystemNotification
 


  type Inbox  {
    notifications:[ Notification! ]
    referencedUsers:[ User! ]
  }
 
  extend type Query { 

    # ---
    # todos los mensajes del usuario logeado
    # DM Mode : si le pasas  dmsWithUID 
    #
    getInbox    ( newerThan:UTCDate, olderThan:UTCDate, dmsWithUID:ID )     :Inbox @auth 

    # ---
    # todos los jcomments y likes a esos comments de un log en particular.
    #
    getLogInbox ( newerThan:UTCDate, olderThan:UTCDate, logid:ID! )         :Inbox 

    # ---
    # todos los jcommens, follows y likes.
    #
    getAllPublicInteractionsInbox( newerThan:UTCDate, olderThan:UTCDate )   :Inbox 

    getDate:String @cacheControl(maxAge: 10)

    #
    # obtener los ultimos announcements...
    #
    getAnnouncements( olderThan:UTCDate, limit:Int! ):[SystemNotification]
  } 



  #
  # ----------------------------------  send message --------------------------------------------------------------
  #

  enum MessageType {
    DM          # el target es un uid
    REPLY       # el target es un message.id
    JCOMMENT    # el target es un log.id
    GLOBAL      # un global ( mensaje para todos )
  }

  type SendMessageResult {
    ${INotificationFields}  
    ${IMessageRef}
  }

  extend type  Mutation {
    sendMessage( message:String!, type:MessageType!, target:ID! ):SendMessageResult  @auth
    deleteMessage( id:ID ):Boolean  @auth
  }

`;

export default $types;