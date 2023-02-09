import { query } from "../../connection.js";
import { TweetChallenge } from "./TwitterChallenge.js";



export class ContainsStringForDays extends TweetChallenge {

    config( valueToTweet, daysUp, donationAmount )
    {
        this.valueToTweet = valueToTweet;
        this.daysUp = daysUp;
        this.donationAmount = donationAmount;

        return this;
    }

    getDescription() {
        return this.desc.replace("%VALUE%", this.valueToTweet)
                        .replace("%DAYS%", this.daysUp)
                        ;
    }

    async getTweet( id ) 
    {
        const tweetData = await super.getTweet( id );

        if( tweetData.text.indexOf( this.valueToTweet )<0 )
        {
            throw new Error( "Tweet doesn't have the required text value in it.");
        }

        return tweetData;
    }

    /**
     * @param { ()=>Promise<void>} callbackIfGranted
     */
    async exec( callbackIfGranted ) 
    {
        const successText = 'The tweet has been up long enough, you have been granted with supporter status for a week!';
        let statusText;

        if( this.isGranted )
        {
            return successText;
        }

        const tweetData = await this.getTweet( this.id ); 

        

        if( tweetData.daysSinceToday >= this.daysUp )
        {
            const ok = await query(`INSERT INTO donations_history SET ?`, {
                uid:this.uid, 
                donation:this.donationAmount, 
                fecha: new Date()
            });

            if( ok.insertId )
            {
                await callbackIfGranted();

                statusText = successText;  
            } 
            else 
            {
                statusText = "Failed to asign reward... try again?";
            } 
            
        }
        else 
        {
            statusText = `Waiting. Tweet has been up for ${tweetData.daysSinceToday} days, need to be up for ${this.daysUp} days.`;
        }

        return statusText;

    }

}