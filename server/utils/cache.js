
import LRUCache from "lru-cache";


const $cache = new LRUCache({  
        maxAge: 1000 * 60 * 60 
});



export const deleteCachedIfKeyMatches = reg => {
    const keys = $cache.keys();
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        
        if( key.match(reg) )
        {
            console.log("DELETE CACHE KEY: ", key );
            $cache.del(key);
            break;
        }
    }
}

/**
 * Devuelve el resultado cacheado o lo genera...
 * uso:
 * ```
 *  var pepe = await getCached("foo").or( ()=>"bar" );
 *  // pepe = "bar"
 * ```
 */
export const getCached = (cacheID, maxAge)=>{
 
    return {
        or: async generator => {

            var rtrn = $cache.get(cacheID);

            if( rtrn )
                return rtrn;

            rtrn = await generator(); 

            if( rtrn )
                $cache.set( cacheID, rtrn, maxAge );

            return rtrn;
        }
    }

};