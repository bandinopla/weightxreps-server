/**
  * 
  * GENERAR  sbd-stats.js ( despues moverlo manualmente a /server/db )
  * 
  * Bajar archivo de https://openpowerlifting.gitlab.io/opl-csv/bulk-csv.html
  * https://openpowerlifting.gitlab.io/opl-csv/files/openpowerlifting-latest.zip
  * 
  * Ejecutar este NODE.... 
  * 
  * 
  */
 import csv from 'csv-parser';
 import fs from 'fs'; 
 import request  from 'request';
 import unzipper from 'unzipper';


 
 
 const url = 'https://openpowerlifting.gitlab.io/opl-csv/files/openpowerlifting-latest.zip';
 const downloaded_file_destiny = 'sbd-rank/data.csv'; 
 const JSON_DESTINY  = "server/db/resolvers/sbd-stats.js";
 
 
 /**
  * JSON = {
  * 
  *      total: ####,
  *      date: //date string,
  *      perclass: [
  *           
  *              {"wclass":{"min":0,"max":59,"name":"59 kg","male":true}, graph:[ [S,B,D],... ], graphAge:[ [ SquatAgesCounter, BenchAgesCounter, DeadliftAgesCounter ],... ] }
  *              // graph: por cada slot en ese array se asume el peso es (i*5) kg y el valor es el numero de gente que levanto ese peso.
  *           
  *      ] ,
  *     ageClasses
  * 
  * }
  */
 
 
 
 //------------------------------------------------------------------------------------------------------------------------------
 
 
 const rows = [];
 const name2obj = new Map();
 
 const wClass = [
     // Male
     [
         59,66,74,83,93,105,120,120
     ],
     //Female
     [
         47,52,57,63,69,76,84,84
     ]
 ]
 const $ageClasses      = []; // !Not sorted!, as they come. Will be filled from data in the cv. Strings representing each age class. Example: "50-54"
 var total = 0;
 const outMales       = [];
 const outFemales     = [];
 
 // generar registros por cada weight class....
 
 wClass.forEach( (wClasses,i) =>{
 
     const isMale = i==0;
     const out       = wClasses.map( (w,i) =>({
         wclass: {
             min     : i==0? 0 : wClasses[i-1]+0.01,
             max     : i>0 && w==wClasses[i-1]? 500 : w,
             name    : w+(w==wClasses[i-1]?"+":"")+ " kg",
             male    : isMale
         },
         graph       : (new Array(500/5)).fill(0).map(v=>[0,0,0]),
         graphAge    : (new Array(500/5)).fill(0).map(v=>[[],[],[]]), // here i will put, per age segment, the count of how many lifts that age bracket did.
     }) );
 
     Array.prototype.push.apply( (i==0? outMales : outFemales),out);
 
 } ); 
 
 
 const __addLift = (rows, sbd, base, name, row) => {
 
     const key = sbd+row.Name;
 
     for ( let i = 0; i < 4; i++ ) {
         
         var kg = parseFloat( row[name+(i+1)+"Kg"] );
 
         if( isNaN(kg) || kg <= 0 )
         {
             continue;
         } 
 
         // ya existe?
         var curr = name2obj.get( key ); 
 
         if( curr?.kg>kg )
         {
             continue;
         }  
 
         var me = {
             ...base,
             kg,
             sbd
         }
 
         rows.push( me );
         name2obj.set( key, me );  
         total++;
 
         //------------------------------------------------------------
        
     }
 
 }
  
 /**
  * stores the ageClass in the global $ageClasses and returns the index of it in that array.
  */
 const __setAgeClass = ageClass => {
    if (!ageClass) return -1;
    let i = $ageClasses.indexOf(ageClass);
    return i >= 0 ? i : $ageClasses.push(ageClass) - 1;
}

 console.log("Downloading latest json from openpowerlifting...");
 request.get(url)
  .pipe(unzipper.Parse())
  .on('entry', entry => {
    const fileName = entry.path;
    
    if (fileName.indexOf(".csv")>0) {
 
      console.log("Reading csv file...");

      entry.pipe(fs.createWriteStream(downloaded_file_destiny))
        .on('finish', () => {
           
            
            fs.createReadStream(downloaded_file_destiny)
            .pipe(csv())
            .on('data', (row) => {
                
                if(row.Equipment!="Raw") return; 
 
                var base = {
                    isf: row.Sex=='F'? 1 : 0,
                    bw: Number(row.BodyweightKg),
                    ageClass: __setAgeClass(row.AgeClass)
                };
            
                __addLift( rows, 0, base, "Squat", row );
                __addLift( rows, 1, base, "Bench" , row);
                __addLift( rows, 2, base, "Deadlift" , row);
            
                console.log(total+" - "+row.Name);

            })

            .on('end', async () => {
 
 
                console.log('CSV file successfully processed'); 
            
                console.log("Processing...")
                rows.forEach( row => {
            
                    if( row.kg>500 ) return;
            
                    const wClasses      = wClass[ row.isf ];
                    const classIndex    = wClasses.findIndex( (v,i)=>(i==0 || row.bw>wClasses[i-1]) && ( v==wClasses[i-1] || row.bw<=v) );
                    const w             = Math.floor(row.kg / 5);
                    const out           = (row.isf? outFemales: outMales)[ classIndex ];
              
                    out.graph[w][ row.sbd ]++; 

//#region per age count
                    if( row.ageClass>-1 )
                    {
                        let perAge = out.graphAge[w][ row.sbd ] ;

                        if(! perAge.length )
                        {
                            let counterPerAgeClass = new Array($ageClasses.length).fill(0);
                            perAge.push( ...counterPerAgeClass ); 
                        }

                        perAge[row.ageClass]++; 
                    } 
//#endregion
            
                } );
            
                console.log("Saving to file JSON...")
                fs.writeFileSync(JSON_DESTINY, "export const sbdstats = " + JSON.stringify({ total, date:new Date(), perclass:[ ...outMales,...outFemales ], ageClasses:$ageClasses }) );
            
                console.log("DONE! "+total+" lifts. saved "+JSON_DESTINY+"."); 
            
              });

        });
    } else {
      entry.autodrain();
    }
  });

  
   