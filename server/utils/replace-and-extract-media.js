

/**
 * 
 * @param {String} txt 
 * @param {(url:String)=>void} onMediaFound 
 */
export default function( txt, onMediaFound, onlyOnce=true ) { 

    let reported = false;

    let tags = [  
        //youtube
        { match:/(?:http(?:s?):\/\/(?:www\.)?)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(?:\?t=(\d+))?\b/g
            , block: (m, videoid)=>{

                !reported && onMediaFound( `https://img.youtube.com/vi/${videoid}/2.jpg` );
                 reported = true;

                return "";
            } } 
    ]; 

    tags.forEach( tag => {

        txt = txt.replace( tag.match, (...args)=>tag.block.apply(null, args) );

    } );

    return txt;

}