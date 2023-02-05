import gql from "graphql-tag";
 

const $types = gql`  
 
  type Supporter {
      user:User!
      when:String #---- date.toIsoString...
  }
  extend type Query {
      getSupporters:[Supporter]
      getActiveSupporters:[Supporter]
  }
   
`;

export default $types;