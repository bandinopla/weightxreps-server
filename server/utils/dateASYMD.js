export const dateASYMD = (d, isUTC, replacePattern = "$1-$2-$3") => { 

    let key = d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate(); 

    if( isUTC )
    {
        key = d.getUTCFullYear()*10000+(d.getUTCMonth()+1)*100+d.getUTCDate(); 
    }

    return key.toString().replace(/(\d{4})(\d{2})(\d{2})/,replacePattern);
} 

//export const ymd2date = ymd=> new Date( ymd.substr(0,4), Number(ymd.substr(5,2))-1, ymd.substr(8) );

export const ymd2date = (ymd, asUTC)=> {

    if( asUTC )
        return new Date( Date.UTC( ymd.substr(0,4), Number(ymd.substr(5,2))-1, ymd.substr(8) ) )
    
    return new Date( ymd.substr(0,4), Number(ymd.substr(5,2))-1, ymd.substr(8) ) 
};