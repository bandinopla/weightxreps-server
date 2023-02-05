export const getInvalidUsernameError = uname => {
    if( uname.length<4 ) return "Username should be at least 4 characters long!";
    if( uname.length>80 ) return "Username is "+ (uname.length-80) + " characters TOO LONG!";

    var bad = uname.match(/[^a-z0-9_]+/gi);

    if( bad )
    {
        return "Only letters, numbers and undercores allowed!";
        //return "The following characters in the username are INVALID: "+ bad.join(", ");
    }

}