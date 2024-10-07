 
import config from "../config.js";
import jwt from "jsonwebtoken" 
import { createHash } from 'crypto';

export const packAsToken = (obj) => 
  jwt.sign(obj, config.tokenSecret, { expiresIn: "30d" });


export const extractTokenData = (token) => {
  try {
    return jwt.verify(token, config.tokenSecret);
  } catch (e) {
    return null;  
  }
}; 

/**
 * Create a sha256 hash of the object
 */
export const hashObject = (obj) => {
  const jsonString = JSON.stringify(obj);
  return createHash('sha256').update(jsonString).digest('hex');
}; 