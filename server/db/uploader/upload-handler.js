import { gql } from "apollo-server-core";
import GraphQLUpload from 'graphql-upload/public/GraphQLUpload.js';



export const UploadTypedef = gql`
    scalar Upload
`;

export const UploadScalarResolver = {
    Upload: GraphQLUpload,
}

