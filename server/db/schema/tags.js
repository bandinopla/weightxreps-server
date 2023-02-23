import gql from "graphql-tag";
 

const $types = gql`  
 
  type UTag {
      id:ID  
      name:String! 
      automatic:Boolean
  }

  type UTagValue {
    id:ID
    tagid:ID!
    logid:ID
    ymd:YMD
    type:String!
    value:String! 
  }  

#   type UTagValueLimits {
#     id:ID! # id of the tag
#     min:Int
#     max:Int
#   }

  type JEditorUTag {
    tag:String
    type:String
    value:Int
  }



  type UTagsUsed {
    tags:[UTag] 
    values:[UTagValue]
  }
   
`;

export default $types;