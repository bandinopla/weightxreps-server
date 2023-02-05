 

//-------------------------
import { ActivityFeedResolvers } from "./resolvers/getActivityFeed.js";
import { SessionResolvers } from "./resolvers/session.js"; 
import { mergeObjects } from "../utils/merge-objects.js";
import { InboxResolvers } from "./resolvers/inbox.js";
import { LikesAndFollowsResolver } from "./resolvers/likes-and-follows.js";
import { JournalResolver } from "./resolvers/journal.js";
import { ExercisesResolver } from "./resolvers/exercises.js";
import { CommunityStatsResolver } from "./resolvers/community-stats.js";
import { CustomScalarsResolver } from "./resolvers/custom-scalars.js";
import { UploadScalarResolver } from "./uploader/upload-handler.js";
import { SettingsResolver } from "./resolvers/settings.js";
import { SupportResolver } from "./resolvers/Support.js";
import { AchievementsResolver } from "./resolvers/achievements.js";
import { VideosResolver } from "./resolvers/videos.js"; 

 

export const Resolvers = mergeObjects([

    CustomScalarsResolver,
    UploadScalarResolver,
    ActivityFeedResolvers,
    SessionResolvers,
    InboxResolvers,
    LikesAndFollowsResolver,
    JournalResolver,
    SessionResolvers,
    ExercisesResolver,
    CommunityStatsResolver,
    SettingsResolver,
    SupportResolver,
    AchievementsResolver,
    VideosResolver 

]);
 
 