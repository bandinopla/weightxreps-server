/** 
 * @param {[Object]} objects  
 */
 export const mergeObjects = objects => {

    let result = {};
 
     objects.forEach( obj => {

        //pegamos todas las propidedades en result
        Object.keys(obj).forEach( prop=> {

            if( result.hasOwnProperty(prop) && (typeof result[prop]=='object') && (typeof obj[prop]=='object'))
            {
                //si ambos son object... 
                // merge!!
                result[prop] = mergeObjects( [ result[prop], obj[prop] ] );
                return;
            }

            result[prop] = obj[prop];
        });

     });

     return result;
}