
    const toLower = itm=>itm.trim().toLowerCase();

    // let tags = [
    //       ["SQ", "#sq", ["Squat", "SQ", "Barbell Back Squat", "Squats", "Safety Squat Bar Squat", "Front Squat", "High Bar Squat", "Frontbøy", "Pause Squat", "Low Bar Squat", "Back squat","knebøy","agachamento","sentadilla"].map(toLower), 2.5]
    //     , ["BP", "#bp", ["Bench","BP", "Barbell Bench Press", "Bænkpres", "Close Grip Bench Press", "Pause Bench Press", "Bænk", "benchpress", "benchpres", "Bench Press","benkpress",  "bænkpress", "Bänkpress","supino", "press de banca"].map(toLower), 2]
    //     , ["DL", "#dl", ["Deadlift", "DL", "Snatch Deadlift", "Dødløft Konventionel", "Conventional Deadlift", "Pause Deadlift", "Paused Deadlift", "Clean Deadlift", "Barbell Straight Leg Romanian Deadlift", "Barbell Deadlift", "Sumo Deadlift", "dead lift" , "Deadlifts","dødløft", "Sumo Dødløft", "peso muerto","markløft","Agachamento", "levantamento terra","peso muerto"].map(toLower), 3]
    //     , ["OHP", "#ohp", ["Overhead Press/Jerk", "OHP", "Overhead Press", "Militarypress", "Jerk", "Snatch push press", "Barbell Overhead Press", "Militærpress","Kickstøt", "military press", "overhead-press", "push press", "push-press", "push jerk", "push-jerk"].map(toLower), 1.1]
    //     , ["SN", "#sn", ["Snatch","envión","Muscle snatch"].map(toLower), 1]
    //     , ["CandJ", "#cnj", ["Clean & Jerk", "C&J", "clean and jerk" ].map(toLower), 1.5]
    //     , ["CH", "#pull", ["Chinup/Pullup","Chinup", "Chins", "Chinups","Pullups","Pullup", "Pull Ups", "Pull Up","Hammer Grip Pullups","Neutral PullUps", "pull-ups", "weighted chinup","Close Grip Chinups","Close Grip Pullups", "Pullupsnøytral", "wide pullups", "Wide Grip Ring Chinups","Ring chinups","Rack chinups", "Chinup (Weighted)", "Klimmzüge"].map(toLower), 1.5]
    // ];
    let tags = [
        [
            "SQ", 
            "#sq", 
            [
                "Squat", "SQ", "Barbell Back Squat", "Squats", "Safety Squat Bar Squat", "Front Squat", "High Bar Squat", "Pause Squat", "Low Bar Squat", "Back squat", 
                "knebøy", "agachamento", "sentadilla", 
                "kyykky", "kyykkä", "kyykkyt", 
                "knäböj", "benspark", "knäböjar", 
                "Kniebeuge", "Beinpresse", "Kniebeugen", 
                "squat", "accroupissement", "soulevé de terre avant"
            ].map(toLower), 
            2.5
        ],
        [
            "BP", 
            "#bp", 
            [
                "Bench", "BP", "Barbell Bench Press", "Close Grip Bench Press", "Pause Bench Press", "Bench Press", 
                "bænkpres", "benkpress", "bænkpress", 
                "penkki", "penkkipunnerrus", "penkkipunnerrukset", 
                "bänkpress", "bänk", 
                "Bankdrücken", "Liegestütz", "Hanteldrücken", 
                "presse de banc", "développé couché", "développé", "BB Bench Press"
            ].map(toLower), 
            2
        ],
        [
            "DL", 
            "#dl", 
            [
                "Deadlift", "DL", "Snatch Deadlift", "Conventional Deadlift", "Pause Deadlift", "Paused Deadlift", "Clean Deadlift", "Barbell Straight Leg Romanian Deadlift", "Barbell Deadlift", "Sumo Deadlift", "dead lift", "Deadlifts", 
                "dødløft", "Sumo Dødløft", 
                "maastaveto", "maastavedot", "suoraveto", 
                "marklyft", "sumomarklyft", "raka marklyft", 
                "Kreuzheben", "Sumo-Kreuzheben", "Rundrücken", 
                "soulevé de terre", "soulevé de terre sumo", "soulevé roumain"
            ].map(toLower), 
            3
        ],
        [
            "OHP", 
            "#ohp", 
            [
                "Overhead Press/Jerk", "OHP", "Overhead Press", "Militarypress", "Jerk", "Snatch push press", "Barbell Overhead Press", "military press", "overhead-press", "push press", "push-press", "push jerk", "push-jerk", 
                "militærpress", "Kickstøt", 
                "pystypunnerrus", "työntö", 
                "militärpress", "axellyft", 
                "Militärpresse", "Stoß", "Schulterdrücken", 
                "développé militaire", "arraché", "poussée", "BB Military Press"
            ].map(toLower), 
            1.1
        ],
        [
            "SN", 
            "#sn", 
            [
                "Snatch", "envión", "Muscle snatch", 
                "ryöstö", 
                "ryck", 
                "Reißen", 
                "arraché", "snatch"
            ].map(toLower), 
            1
        ],
        [
            "CandJ", 
            "#cnj", 
            [
                "Clean & Jerk", "C&J", "clean and jerk", 
                "puhdas ja työntö", 
                "stöt", "clean och jerk", 
                "Ziehen und Stoßen", "Sauber und Stoß", 
                "arraché et épaulé-jeté", "nettoyage et poussée"
            ].map(toLower), 
            1.5
        ],
        [
            "CH", 
            "#pull", 
            [
                "Chinup/Pullup", "Chinup", "Chins", "Chinups", "Pullups", "Pullup", "Pull Ups", "Pull Up", "Hammer Grip Pullups", "Neutral PullUps", "pull-ups", "weighted chinup", "Close Grip Chinups", "Close Grip Pullups", "Pullupsnøytral", "wide pullups", "Wide Grip Ring Chinups", "Ring chinups", "Rack chinups", "Chinup (Weighted)", 
                "leuanveto", "leuanvedot", 
                "haka", "hakar", 
                "Klimmzug", "Klimmzüge", 
                "traction", "tractions"
            ].map(toLower), 
            1.5
        ]
    ];

export function getOfficialExercises() {
    return tags.map( e=>({
        id: e[0],
        tag: e[1],
        variants: e[2],
        coolxbw: e[3]
    }) );
}

export function getAllOfficialEnames( onlyTheseTypes = null ) {
    return tags.reduce( (arr, lift)=>{

        if( onlyTheseTypes && onlyTheseTypes.indexOf(lift[0])>=0 )
        {
            Array.prototype.push.apply( arr, lift[2]);
        } 

        return arr; 
    } , [] );
}

export function getAllOfficialETags( onlyTheseTypes = null  ) {
    return tags .filter( tag=>!onlyTheseTypes || onlyTheseTypes.indexOf(tag[0])>=0 ) 
                .map( lift=>lift[1] );
}



/** 
 * Obtiene el tag de un ejercicio en base a su nombre...
 * 
 * @param {String} ename 
 * @return String
 */
export function ename2type( ename ) { 

    ename = ename.trim().toLowerCase(); 

    for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];

        if( ename.indexOf( tag[1] )>0 || tag[2].indexOf( ename )>-1 )
        {
            return tag[0] ;
        } 
    }

    return null;
}