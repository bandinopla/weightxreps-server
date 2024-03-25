import { SECTIONS, getForumSections } from "./data.js";

/** 
 * @param {Array<any>} arr 
 * @param {Array<string>} possiblePointers  -properties on arr[*] that might have a pointer
 */
export const resolveForumPointers = async (arr, possiblePointers) => {

    if(!arr.length) return;

    //
    // collect pointers to texts outside the forum... This is handled by the section.
    //
    const pointerResolvers = arr.reduce( (acc, itm)=>{

        possiblePointers.forEach( prop=>{
            const section = SECTIONS.find(s=>itm[prop] && s.idIsMine && s.idIsMine( itm[prop] ) && s.resolvePointerToText );
            if( section )
            { 
                if( !acc.has(section) )
                {
                    acc.set(section,[]);
                }

                acc.get(section).push({
                    pointer     : itm[prop],
                    onResolved  : text=>itm[prop]=text
                });
            }
        });

        return acc;
    } ,new Map());

    if( pointerResolvers?.size > 0)
    { 
        //
        // for each pointer to external text, add the text it is refering to...
        //
        await Promise.all([ ...pointerResolvers ].map( async ([resolver,pointers])=>{
            const uniquePointers = [ ...new Set(pointers.map(p=>p.pointer)) ];
            const resolvedTexts  = await resolver.resolvePointerToText( uniquePointers );

            pointers.forEach( p=>{
                const pointerIndex = uniquePointers.indexOf( p.pointer );
                p.onResolved( resolvedTexts[pointerIndex] );
            });
        }));
    }
}

/**
 * expects items to be an array of items with a property "forumSlug" which will be a section id, and the idea is to replace it with the actual slug.
 */
export const addMissingForumSectionSlugs = async ( items )=> {
 
    var $sections = SECTIONS;

    if( items.some(s=>s.forumSlug>100 ) )
    {
        $sections = await getForumSections();
    } 

    items.forEach( itm=>{
        itm.forumSlug = $sections.find(s=>s.id==itm.forumSlug).slug;
    })

}