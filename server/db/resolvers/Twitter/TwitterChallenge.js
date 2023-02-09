import Twit from "twit"; 
import config from "../../../config.js";


const T = new Twit( JSON.parse(config.twitterConfig) ); 

export const getTweetById = async id => await T.get(`statuses/show/${id}`);


export class TweetChallenge {

    /**  
     * @param {string} title 
     * @param {string} desc 
     */
    constructor( title, desc )
    {
        this.title = title;
        this.desc = desc;
    }

    getDescription() {
        return this.desc;
    }

    async getTweet( id ) 
    {
        const tweet = await getTweetById(id);
        const tweetData = tweet.data ;   
        const diffTime = Math.abs(new Date() - new Date(tweetData.created_at));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
     
        console.log( tweet )
    
        return  {
            ...tweetData,
            daysSinceToday: diffDays
        };
    };

    /** 
     * @param {string} id 
     * @param {number} uid 
     * @param {Date} fecha 
     * @param {boolean} isGranted 
     */
    setState( id, uid, fecha, isGranted ) {

        this.id = id;
        this.uid = uid;
        this.fecha = fecha; 
        this.isGranted = isGranted;

        return this;
    }
 

    /**
     * @param { ()=>Promise<void>} callbackIfGranted
     */
    async exec( callbackIfGranted ) 
    {
        throw new Error("Method not implemented by subclass.");
    } 
}
 