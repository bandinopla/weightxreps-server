/**
 * @typedef {{ id:number, wkg:number, inlbs:number, added2BW:number, sets:number, ymd:string, bw:number, distance:number, distance_unit:string, duration:number, type:number }} Erow 
 */

export class PRsOfWxDorT {

    // W x Distance (time is tie breaker)
    // W x Time

    /**
     * @type {Map<number, Erow>}
     */
    #id2Erow

    /**
     * @type {Erow}
     */
    #maxDistance;

    /**
     * @type {Erow}
     */
    #minDistance;

    /**
     * @type {Erow}
     */
    #topSpeed

    /**
     * @type {Erow}
     */
    #minTime

    /**
     * @type {Erow}
     */
    #maxTime

    /**
     * @type {Erow}
     */
    #maxForce;

    /**
     * @type {Array<Erow>}
     */
    minDistancePR;

    /**
     * @type {Array<Erow>}
     */
    maxDistancePR;


    /**
     * @type {Array<Erow>}
     */
    maxTimePR;

    /**
     * @type {Array<Erow>}
     */
    minTimePR;

    /**
     * @type {Array<Erow>}
     */
    speedPR;

    /**
     * @type {Array<Erow>}
     */
    maxForcePR;

    /**
     * weight carried over distance PRs
     * @type {Array<Erow>}
     */
    WxD_PRs;

    /**
     * weight holded / resisted for time
     * @type {Array<Erow>}
     */
    WxT_PRs;

    /**
     * PR table where Distance is the first factor and Time is the tie breaker.
     * Goal is the X distance in the least time.
     * 
     * @type {Array<Erow>}
     */
    DxTPR;

    constructor([ id2Erow, maxDistance, minDistance, speedPR, DxTPR, minTime, maxTime, maxForce, wxdPRs, wxtPRs ]=[]) { 

        this.#id2Erow = id2Erow ?? new Map();
        this.maxDistancePR = maxDistance ?? [];
        this.minDistancePR = minDistance?? [];
        this.minTimePR = minTime ?? [];
        this.maxTimePR = maxTime ?? [];
        this.speedPR = speedPR?? [];
        this.DxTPR = DxTPR?? [];
        this.maxForcePR = maxForce ?? [];
        this.WxD_PRs = wxdPRs ?? [];
        this.WxT_PRs = wxtPRs ?? [];

        if( maxDistance ) this.#maxDistance = this.maxDistancePR[this.maxDistancePR.length-1]; 
        if( minDistance ) this.#minDistance = this.minDistancePR[this.minDistancePR.length-1]; 
        if( speedPR ) this.#topSpeed = this.speedPR[this.speedPR.length-1]; 

        if( minTime ) this.#minTime = this.minTimePR[this.minTimePR.length-1]; 
        if( maxTime ) this.#maxTime = this.maxTimePR[this.maxTimePR.length-1]; 

        if( maxForce ) this.#maxForce = this.maxForcePR[this.maxForcePR.length-1];
 
    }

    /** 
     * This is called with erow from oldest to newest date. In chronological order in which occured.
     * 
     * @param {Erow} erow 
     */
    accumulate( erow ) 
    {  
        this.#id2Erow.set( erow.id, erow );

        //
        // Exercise is just done by distance. For example... running, or static byke.
        //
        if( erow.distance )
        {  
            //
            // distance by time type of exercise...
            //
            if( erow.duration )
            {
                //
                // distance in time. We care about the time in which we executed that distance, we are not interested in the distance itself.
                //
                if(!this.#topSpeed || WxDoT_SpeedOf(this.#topSpeed) < WxDoT_SpeedOf(erow) )
                {
                    this.#topSpeed = erow;
                    this.speedPR.push( erow );
                }

                const distance =  WxDoT_DistanceOf(erow);
                const seconds = WxDoT_DurationOf(erow);
                const hasDoneBetter = this.DxTPR.some( (DxT) => WxDoT_DistanceOf(DxT)>=distance && WxDoT_DurationOf(DxT)<=seconds );

                if(!hasDoneBetter)
                {
                    this.DxTPR.push(erow);
                }
            }

            //
            // in this case we only track min and max distance...
            //

            if( !this.#minDistance || this.#minDistance.distance > erow.distance )
            {
                this.#minDistance = erow;
                this.minDistancePR.push( erow );
            }

            if( (!this.#maxDistance && this.#minDistance && erow.distance>this.#minDistance.distance) || ( this.#maxDistance && this.#maxDistance.distance < erow.distance && erow.distance>this.#minDistance.distance ) )
            { 
                this.#maxDistance = erow;
                this.maxDistancePR.push(erow);
            } 

            //
            // Weight x Distance ( use time taken to break ties if any )
            //
            if( erow.wkg )
            {  
                // A) no other best found
                // B) other is same as us, but has no duration and we do.
                // C) other is same as us, but we did it in less time
 
                this.#addWeightxFactorPRs( this.WxD_PRs, erow, 'distance', true, 
                                            (erowA, erowB) => (erowA.duration==0 && erowB.duration>0) || (erowA.duration>0 && erowB.duration>0 && erowB.duration<erowA.duration) 
                                         );
            }
            
        } 

        if( erow.duration )
        {
            if( !this.#minTime || this.#minTime.duration > erow.duration )
            {
                this.#minTime = erow;
                this.minTimePR.push( erow );
            }

            if( (!this.#maxTime && this.#minTime && erow.duration>this.#minTime.duration) || ( this.#maxTime && this.#maxTime.duration < erow.duration ) )
            {
                this.#maxTime = erow;
                this.maxTimePR.push(erow);
            }

            if( !erow.distance ) //<--- only weight x time 
            {
                //
                // Weight x Time : here we calculate the energy required by gravity to move this weight over this distance and use that number to compare which one is better.
                //
                if( erow.wkg )
                {  
                    // A) no other best found
                    // B) other is same as us, but has no duration and we do.
                    // C) other is same as us, but we did it in less time
    
                    this.#addWeightxFactorPRs( this.WxT_PRs, erow, 'duration', true, 
                                                (erowA, erowB) => false 
                                            );
                }
            }
 
        }

        if( erow.wkg && erow.distance && erow.duration )
        { 
            if( !this.#maxForce || WxDoT_ForceOf( this.#maxForce ) < WxDoT_ForceOf(erow) )
            {
                this.#maxForce = erow;
                this.maxForcePR.push(erow);
            }
        }

    } 

    /**
     * Compares `erow` against all the current bests to see if it should be added to the list or not.
     * 
     * @param {Array<Erow>} arr 
     * @param {Erow} erow 
     * @param {string} prop 
     * @param {bool} greatestWins the `prop` with the greatest value wins?
     * @param { (a:Erow, b:Erow)=>boolean } bIsBetter 
     */
    #addWeightxFactorPRs( arr, erow, prop, greatestWins, bIsBetter ) 
    {
        const currentBest = arr.find( erow2=>{

            const propWins = greatestWins? erow2[prop]>=erow[prop] : erow2[prop]<=erow[prop];

            return propWins && erow2.wkg>=erow.wkg;

        }); 

        const isSimilar = currentBest?.[prop]==erow[prop] && currentBest?.wkg==erow.wkg;

        if( !currentBest || (isSimilar && bIsBetter( currentBest, erow ) ) )
        {
            arr.push(erow);
        }
    }

    onlyOlderThan( till ) { 
        return new PRsOfWxDorT([
            this.#id2Erow,
            this.maxDistancePR.filter( erow => erow.ymd.valueOf() < till.valueOf() ),
            this.minDistancePR.filter( erow => erow.ymd.valueOf() < till.valueOf() ),
            this.speedPR.filter( erow => erow.ymd.valueOf() < till.valueOf() ),
            this.DxTPR.filter( erow => erow.ymd.valueOf() < till.valueOf() ),
            this.minTimePR.filter( erow => erow.ymd.valueOf() < till.valueOf() ),
            this.maxTimePR.filter( erow => erow.ymd.valueOf() < till.valueOf() ),
            this.maxForcePR.filter( erow => erow.ymd.valueOf() < till.valueOf() ),
            this.WxD_PRs.filter( erow => erow.ymd.valueOf() < till.valueOf() ),
            this.WxT_PRs.filter( erow => erow.ymd.valueOf() < till.valueOf() )
        ])
    }

    getBestStats() {

        return {
            maxDistance : this.#maxDistance? { val: this.#maxDistance.distance, unit:this.#maxDistance.distance_unit, when: this.#maxDistance.ymd } : null,  
            minDistance : this.#minDistance? { val: this.#minDistance.distance, unit:this.#minDistance.distance_unit, when: this.#minDistance.ymd } : null,  
            topSpeed    : this.#topSpeed? { val: WxDoT_SpeedOf(this.#topSpeed), unit:this.#topSpeed.distance_unit, when: this.#topSpeed.ymd } : null, // meters per second
            minTime     : this.#minTime? { val: this.#minTime.duration, unit:'s', when: this.#minTime.ymd } : null,
            maxTime     : this.#maxTime? { val: this.#maxTime.duration, unit:'s', when: this.#maxTime.ymd } : null,
            maxForce    : this.#maxForce? { val: WxDoT_ForceOf(this.#maxForce), unit:'N', when: this.#maxForce.ymd } : null
        }

    }

    addPRsForPRHistory( json ) {

        const wxdotPRS = {};
        const erows = [];
        const ymds = [];
        const erowi2ymdi = [];
        const prs = [
            "minDistancePR",
            "maxDistancePR",
            "maxTimePR",
            "minTimePR",
            "speedPR",
            "maxForcePR",
            "WxD_PRs",
            "WxT_PRs",
            "DxTPR",
        ];

        const id2index = new Map();

        for( const prProp of prs ) {

            /** @type {Array<Erow>} */
            const arr = this[prProp];

            wxdotPRS[ prProp ] = [];
            
            for( const erow of arr ) 
            { 
                //#region resolve erowIndex & ymdIndex
                if( !id2index.has(erow.id) )
                {
                    id2index.set(erow.id, erows.length );
                    
                    erows.push({
                        w: erow.wkg,
                        lb: erow.inlbs,
                        ubw: erow.added2BW,
                        t: erow.duration,
                        d: erow.distance,
                        dunit: erow.distance_unit,
                        type: erow.type,

                        speed: WxDoT_SpeedOf(erow),
                        force: WxDoT_ForceOf(erow),
                    })
                } 

                const erowIndex = id2index.get(erow.id);
                let ymdi = ymds.findIndex(ymd=>ymd.valueOf()==erow.ymd.valueOf())

                if( ymdi<0 )
                {
                    ymdi = ymds.length;
                    ymds.push( erow.ymd );
                } 
                
                erowi2ymdi[ erowIndex ] = ymdi;
                //#endregion

                wxdotPRS[ prProp ].push( erowIndex );
            } 
        }

        wxdotPRS.erows = erows;
        wxdotPRS.ymds = ymds;
        wxdotPRS.erowi2ymdi = erowi2ymdi;

        json.wxdotPRS = wxdotPRS;

        // minDistancePR:[Int]
        // maxDistancePR:[Int]
        // maxTimePR:[Int]
        // minTimePR:[Int]
        // speedPR:[Int]
        // maxForcePR:[Int]
        // WxD_PRs:[Int]
        // WxT_PRs:[Int]
        // DxTPR:[Int]

    }

}

/** 
 * @param {Erow} erow 
 * @returns {number} time of the duration in seconds
 */
export const WxDoT_DurationOf = erow => (erow.duration || 0) / 1000; //in the db it is stored in milliseconds


/** 
 * @param {Erow} erow 
 * @returns {number} distance in meters
 */
export const WxDoT_DistanceOf = erow => ((erow.distance || 0) / 100) * 0.01; //in the db it is stored as cm*100


/**
 * @param {Erow} erow
 * @returns {number} speed in meters per second
 */
export const WxDoT_SpeedOf = erow => erow.duration && erow.distance ?WxDoT_DistanceOf(erow) / WxDoT_DurationOf(erow) : 0;


/**
 * @param {Erow} erow
 * @returns {number} force in Newtons
 */
export const WxDoT_ForceOf = erow => {

    if( erow.distance && erow.duration && erow.wkg )
    {
        const distance = WxDoT_DistanceOf(erow);
        const time = WxDoT_DurationOf(erow); 
    
        const acceleration = (2 * distance) / Math.pow(time, 2);
        return erow.wkg * acceleration;
    } 
}

/**
 * @param {Erow} erow
 * @returns {number} force in Newtons
 */
export const WxDoT_EnergyToMove = erow => {

    if( erow.wkg && erow.distance)
    {  
        const F = erow.wkg * 9.81; // Acceleration due to gravity on Earth's surface in m/s^2
        const J = F * WxDoT_DistanceOf(erow);
        return J;
    } 
}


/**
 * From a mysql erow to grapql erow fields.
 */
export const WxDoT_GQLErowFields = erow =>({
    type: erow.type,
    t : erow.duration, // in milliseconds
    d : erow.distance, // in cm*100
    dunit : erow.distance_unit, 

    speed   : WxDoT_SpeedOf(erow), // meters per second or 0 
    force   : WxDoT_ForceOf(erow) // Newtons 
});


