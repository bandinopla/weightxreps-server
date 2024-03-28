import gql from "graphql-tag";

const $types = gql`

  scalar YYYYMMDD
  scalar CalendarDayKey 
  scalar ESet

  type BestLift {
    w:Float! 
    e:Exercise!
  }

  type UserInfo {
    user:User!
    daysLogged:Int! 
    best3:[BestLift!] 
    forum:ForumStatus
  }

 #------------------------------------------------------------ 

  type EBlock {
    eid:ID!
    sets:[Set]!
  } 

  type BestEStat {
    w:Float!
    r:Int!
    lb:Int!
    when:YMD!
    bw:Float
    est1rm:Float #va a ser CERO si reps=0 o 10+
  }

  type UnitValueWhen {
    val:Float!
    when:YMD!
    unit:String!
  }

  type BestWxDorT { 
    maxDistance:UnitValueWhen 
    minDistance:UnitValueWhen
    topSpeed:UnitValueWhen
    maxTime:UnitValueWhen
    minTime:UnitValueWhen 
    maxForce:UnitValueWhen
  }

  type EBestStats {
    eff:BestEStat #best EFF
    int:BestEStat #best INT
    prsWxDorT:BestWxDorT
  }

  type ERef {
    exercise:Exercise!
    best:EBestStats
  }

  type JLog {
    id:ID!
    log:String
    fromMobile:Boolean
    bw:Float 
    eblocks:[EBlock]
    exercises:[ERef]
    utags:[UTag]
    utagsValues:[UTagValue]
  }
 #------------------------------------------------------------
 

 type Set { 
   w:Float
   r:Float
   s:Float
   lb:Int
   ubw:Int      # used BW. En ese caso, al "w" hay que restarle el valor del BW. Ya que lo tendrá incluido.
   c:String     # comentarios del set....
   rpe:Float    # el RPE del set
   pr:Int       # 0|1 si es PR o no 
   

   #
   # stats w x r
   #
   est1rm:Float
   eff:Float
   int:Float

   #
   # stats weight x time or distance
   # 
   t:Int        #milliseconds
   d:Int        #distance in centimeters * 100
   dunit:String # unit of the distance
   type:Int     # 0 WxR set y >1 WxDoT set

   speed:Float # in meters per second.... 
   force:Float # in Newtons
   
 } 

 type JRangeDayData {
    on:YMD
    did:[EBlock]
 }



 type JRangeData {
   from:YMD 
   to:YMD
   exercises:[Exercise]!
   days:[JRangeDayData]
   utags:UTagsUsed 
 }

 #-----------------------------------------------------------------------------------

 type JEditorText {
     text:String
 }

 type JEditorEROW {
     usebw:Int 
     v:Float 
     lb:Int 
     r:Int 
     s:Int 
     c:String
     rpe:Float

    #
    # stats weight x time or distance
    # 
    t:Int        #milliseconds
    d:Int        #distance in centimeters * 100
    dunit:String # unit of the distance
    type:Int     # 0 WxR set y >1 WxDoT set
 }

 type JEditorEBlock {
     e:Int 
     sets:[JEditorEROW]
 }

 type JEditorDayTag {
     on:YMD!
 }

 type JEditorBWTag {
     bw:Float
 }

 type JEditorNewExercise {
     newExercise:String!
 }

 union JeditorRow = JEditorText | JEditorEBlock | JEditorDayTag | JEditorBWTag | JEditorNewExercise | UTagValue

 type JEditorData {
     did:[JeditorRow]
     exercises:[ExerciseStat]! 
     etags:[String]!
     utags:[UTag]
     baseBW:Float
 }


#--------------------- SAVE DATA
 
 scalar JEditorSaveRow
#--------------------------------------------
     

  extend type Query {  
    userInfo( uname:String! ):UserInfo! @UserMustAllow 
    userBasicInfo( of:ID, ofThese:[ID!] ):[User!]
    getCalendarDays( uid:ID!, from:YYYYMMDD!, to:YYYYMMDD! ):[CalendarDayKey] @UserMustAllow 
    jday(uid:ID!, ymd:YMD):JLog @UserMustAllow 
    jrange(uid:ID!, ymd:YMD!, range:Int!):JRangeData @UserMustAllow 
    jeditor(ymd:YMD, range:Int):JEditorData @auth @UserMustAllow 
    downloadLogs:JEditorData @auth @UserMustAllow
    alsoposted(ymd:YMD):[User]
    getYearOverview( uid:ID!, year:Int! ):[Int] @UserMustAllow 
    getYearsLogged( uid:ID! ):[Int] @UserMustAllow
  }

  extend type Mutation {
      saveJEditor( rows:[JEditorSaveRow], defaultDate:YMD! ):Boolean @auth @UserMustAllow 
  }
`;

export default $types;