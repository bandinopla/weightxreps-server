import gql from "graphql-tag"; 

const $types = gql`

    type ForumRole {
        id:ID!
        title:String!
        all:Boolean
        can:[String!] # id of the actions it can do...
    }

    type RoleDescriptor {
        key:ID!
        title:String!
        description:String!
    }

    type ForumStatus {
        posts:Int  # total number of threads + replies done by this user in the forum.
        role:ForumRole
    }

    type ForumMessage {
        id:ID!
        when:UTCDate!
        user:ID!
        sectionId:ID
        threadId:ID
        parentId:ID
        message:String!
        note:String # notes attached to the post by a moderator.

        replies:Int #total, including replies of replies...
        likes:Int 
        dislikes:Int  
    }

    type Messages {
        messages:[ForumMessage]
        users:[User] 
    }

    type ForumSection {
        id:ID!
        name:String!
        slug:String!
        description:String
        threads:Int
        replies:Int
    } 

    extend type Query {
        getForumSections: [ForumSection]
        getForumMessages(sectionId:ID, olderThan:UTCDate, limit:Int):Messages
        getThreadMessages(messageId:ID, offset:Int, limit:Int):Messages
        getForumPostIndex(postId:ID!):Int!
        getForumRolesDescription:[RoleDescriptor]
    }

    extend type Mutation {
        postForumMessage(sectionId:ID!, parentId:ID, message:String!):ID @auth @oauth(scope:"forum,forum:write")
        setForumPostNote( messageId:ID!, note:String! ):Boolean @auth @no_oauth
        deleteForumMessage(id:ID, why:String):Boolean @auth  @oauth(scope:"forum,forum:delete")
    }

`;

export default $types;