const esm2cjs = require('esm-cjs');  

var glob = require('glob');
var { copyFileSync, unlinkSync, rmdirSync, rmSync, mkdirSync, readFileSync, writeFileSync } = require("fs");

try{
    rmSync("./server-to-upload", {recursive :true});
    console.log("DIR REMOVED!")
}catch(e){
    //
}

mkdirSync("./server-to-upload");

glob('./server/**/*', function(err, files) {
    

    files.forEach( file => {

        const nfile = file.toString().replace("server","server-to-upload");

        if( file.indexOf(".js")<0 )
        {
            mkdirSync( nfile ); 
        }
        else 
        {
            var contents = readFileSync( file, {encoding:"utf-8"} );

            try 
            {
                var output = esm2cjs(contents);

                writeFileSync( nfile, output );
            }
            catch (e) {
                console.log( { file, error:e })
            }  

        }

    });

    
}); 


//copiar packages...
copyFileSync("package-lock.json","./server-to-upload/package-lock.json");


//
// because Namecheap's NodeJS setup doesn't support ESM.
//
var packageJson = JSON.parse( readFileSync("package.json","utf-8") );
packageJson.type = "commonjs"; 
writeFileSync("./server-to-upload/package.json", JSON.stringify(packageJson, null, 2));




console.log("Done..."); 