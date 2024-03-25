import { query } from "../../connection.js";
import { getAnnouncementTextById, getAnnouncementsAsMessages, getAnnouncementsCount, getAnnouncementsThreadMessages } from "./forum-announcements.js";

/**
 * Time to wait before being able to post again, in seconds.
 */
export const COOLDOWN_SECONDS_BEFORE_REPOSTING = 15;

export const FORUM_ROLE_ACTION = {
    delete:1,
    note:2 
}
 
export const FORUM_ROLES = {
    ADMIN: {
        id: 1,
        all:true,
        title: "Forum Admin", //can create/remove forums that he/she has created only.
        description:"Responsable for administrating the forum"
    },
    MODERATOR: {
        id: 2,
        can: [
            FORUM_ROLE_ACTION.delete,
            FORUM_ROLE_ACTION.note
        ],
        title: "Forum Moderator",
        description:"Responsable for moderating the posts in the forum, can delete or attach notes to posts."
    },
    NOTER: {
        id: 3,
        can: [
            FORUM_ROLE_ACTION.note
        ],
        title: "Community Noter",
        description:"Can attach notes to posts to complement or dispute information."
    }
}

/**
 * Hardcoded sections...
 * NEW SECTIONS can be added in the database, will be the posts with everything set to CERO. The post_preview will be the title and the post_comment the description.
 */
export const SECTIONS = [
    {
        id: 5,
        name:"Announcements",
        description: "Site news / global messages",
        slug:"announcements", 
        getForumMessages(){
            return getAnnouncementsAsMessages.bind(this)
        },
        getThreadMessages(){
            return getAnnouncementsThreadMessages.bind(this)
        },
        idIsMine: id=>id?.indexOf("global:")>-1,
        resolvePointerToText: getAnnouncementTextById,
        getThreadCount: getAnnouncementsCount,
        threadsCantBeDeleted: true,
        threadsCantBeCreated: true
    },
    {
        id: 1,
        name: "General",
        description: "General talk about anything and everything",
        slug:"general-talk"
    },
    {
        id: 2,
        name: "Routines | Programs",
        description: "Questions about specific routines or programs or to share experiences in those programs...",
        slug:"routines-and-programs"
    },
    {
        id: 3,
        name: "Nutrition | Supplements",
        description: "Talk about nutrition and things to consume to improve health or performance",
        slug:"nutrition-and-supplements"
    },
    {
        id: 4,
        name: "Help | Bug Reports | Suggestions",
        description: "Suggest changes or report bugs in the site, give your opinion on how things run here.",
        slug:"help-bug-reports-suggestions"
    }
]


/**
 * We have hardoded sections but also support creating new sections in the DB. They have sectionID and parentId equal to CERO.
 */
export const getForumSections = async ()=>{
    //
    // new sections added manually in the DB...
    //
    const dbSections = await query(`SELECT * FROM forum WHERE section_id=0 AND parent_id=0 ORDER BY id ASC`); // becaue a mention will have section=0 but parent_id>0

    return SECTIONS.concat( dbSections.length? dbSections.map(s=>({
        id: 100 + s.id,
        name: s.post_preview,
        description: s.post_comment,
        slug: slugify(s.post_preview), 
    })) : [] );
}

/**
 * returns the role object with that ID...
 * @returns {{ id: number, key:string, title: string, canDo:(action:number)=>boolean }}
 */
export const getForumRoleById = roleId => {

    if(!roleId) return;

    const roleEntry = Object.entries(FORUM_ROLES).find(entry=>entry[1].id==roleId || entry[0]==roleId);
    const roleConfig = roleEntry?.[1];

    if( roleConfig )
    {
        return {
            ...roleConfig,
            key: roleEntry[0],
            canDo: action => roleConfig.all || roleConfig.can?.indexOf(action)>-1,

            toJs() {

                var actions = Object.entries(FORUM_ROLE_ACTION);   

                return {
                    ...this,
                    can: this.can?.map( actionID=>actions.find( a=>a[1]==actionID )?.[0] )
                }
            }
        };
    } 
}

