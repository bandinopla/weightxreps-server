# `scalar JEditorSaveRow`
When saving a log, you send it to the [`saveJEditor`](../server/db/resolvers/save-journal.js) mutation, where the `rows` param is an array of `JEditorSaveRow`. That type of object can come in any of these variations:

## New exercise tag
`{ newExercise:"the name of the new exercise"}`

## Bodyweight tag
`{ bw:76, lb:0 }` 
- `bw` the bodyweight of the user. A `number`
- `lb` The bw comes in as the user typed it. This prop is used to know in what unit that was, being 1 = Pounds or 0=kilograms. If it is undefined the default weight unit of the current user will be used to guess it.

## Delete log tag
`{ delete:true }` Indicates that the day in which this was used should be deleted.

## Day log tag
A tag indicating what was done on a particular day...<br/>
`{ on:"YYYY-MM-DD", did:[ <DayToken> ] }`
 
<br/>
<br/>

# `<DayToken>` one of...

## User Tag
`{ tag:"User typed tag name", type:"TAG ID", value:"..." }`
- `tag` string typed by the user
- `type` string, a key of [tag types](https://github.com/bandinopla/weightxreps-client/blob/9c303fd7f3c825139b27b73c74e8ada4c5bd77f0/src/user-tags/data-types.js)
- `value` string, a serialized value generated by the tag itself in the frontend. See link above.

## Simple text
`{ text:"some user typed text" }`

## Exercise Block
`{ eid:number, erows:[ <Set> ] }`
- `eid` Number, id of an exercise.
- `erows` Array of `<Set>` the sets done on that execise.
<br/>
<br/>

# `<Set>` {...}
- `w` Can be an array of this object also or just this object {...}
    - `v` value. Number, the weight used.
    - `lb` optional `boolean` indicating if weight was typed as Pounds (lb=1) or Kilograms (lb=0)
    - `usebw` optional `0 | 1` If this is `1` then `v` will be the weight added to the bodyweight and the bodyweight for the day will be used to calculate the total weight used `bw + v`
- `r` number, reps.
- `s` number, sets done.
- `c` string. User typed comment.
- `t` Optional time in milliseconds.
- `d` Optional distance done **in centimeters * 100**. 
- `distance_unit` Units of the distance used one of `('cm','m','km','in','ft','yd','mi')`
- `rpe` Array of numbers or a number. 
- `type` A type value of [SET_TYPES](https://github.com/bandinopla/weightxreps-client/blob/main/src/data/set-types.js) which indicates how the data of this set wil be intrpreted.
