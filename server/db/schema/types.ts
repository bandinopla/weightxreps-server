export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  CalendarDayKey: any;
  ESet: any;
  JEditorSaveRow: any;
  OauthReplacementType: any;
  SBDSlot: any;
  SettingValue: any;
  UTCDate: any;
  Upload: any;
  YMD: any;
  YYYYMMDD: any;
};

/** A generic thing that was achieved.  */
export type Achievement = {
  __typename?: 'Achievement';
  description: Scalars['String'];
  id: Scalars['ID'];
  name: Scalars['String'];
};

/** Represents the state of an achievement for a particular user.  */
export type AchievementState = {
  __typename?: 'AchievementState';
  /** ID of the achievement */
  aid: Scalars['ID'];
  /** If it was achieved or not */
  gotit?: Maybe<Scalars['Boolean']>;
  /** Details particular to this specific achievement */
  note?: Maybe<Scalars['String']>;
  when?: Maybe<Scalars['YYYYMMDD']>;
};

export enum ActivityFeedType {
  Following = 'following',
  Global = 'global'
}

export type BaseStat = {
  bw?: Maybe<Weight>;
  by: Scalars['ID'];
  e: Scalars['ID'];
  w: Weight;
};

export type BestEStat = {
  __typename?: 'BestEStat';
  bw?: Maybe<Scalars['Float']>;
  est1rm?: Maybe<Scalars['Float']>;
  lb: Scalars['Int'];
  r: Scalars['Int'];
  w: Scalars['Float'];
  when: Scalars['YMD'];
};

export type BestLift = {
  __typename?: 'BestLift';
  e: Exercise;
  w: Scalars['Float'];
};

export type BestWxDorT = {
  __typename?: 'BestWxDorT';
  maxDistance?: Maybe<UnitValueWhen>;
  maxForce?: Maybe<UnitValueWhen>;
  maxTime?: Maybe<UnitValueWhen>;
  minDistance?: Maybe<UnitValueWhen>;
  minTime?: Maybe<UnitValueWhen>;
  topSpeed?: Maybe<UnitValueWhen>;
};

export type BlockUsersSetting = Setting & {
  __typename?: 'BlockUsersSetting';
  id: Scalars['ID'];
  unames?: Maybe<Array<Maybe<Scalars['String']>>>;
  waitingCodeToChange?: Maybe<Scalars['Boolean']>;
};

export enum BulkMode {
  Delete = 'DELETE',
  Merge = 'MERGE'
}

export type Cc = {
  __typename?: 'CC';
  cc: Scalars['ID'];
  name: Scalars['String'];
};

export type CcSetting = Setting & {
  __typename?: 'CCSetting';
  cc?: Maybe<Scalars['String']>;
  ccs?: Maybe<Array<Maybe<Cc>>>;
  id: Scalars['ID'];
  waitingCodeToChange?: Maybe<Scalars['Boolean']>;
};

export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

export type CommunityStats = {
  __typename?: 'CommunityStats';
  estimated?: Maybe<Array<Maybe<Estimated1Rm>>>;
  exercises?: Maybe<Array<Maybe<Exercise>>>;
  heavyest?: Maybe<Array<Maybe<Heavyest>>>;
  scanFrecuency: Scalars['String'];
  timestamp?: Maybe<Scalars['UTCDate']>;
  title: Scalars['String'];
  users?: Maybe<Array<Maybe<User>>>;
  volume?: Maybe<Array<Maybe<MostVolume>>>;
};

export type ConfirmAction = {
  __typename?: 'ConfirmAction';
  id: Scalars['ID'];
  message: Scalars['String'];
};

export type ConnectedService = {
  __typename?: 'ConnectedService';
  id: Scalars['String'];
  name: Scalars['String'];
  url: Scalars['String'];
};

export type ConnectedServicesSetting = Setting & {
  __typename?: 'ConnectedServicesSetting';
  connections?: Maybe<Array<ConnectedService>>;
  id: Scalars['ID'];
  waitingCodeToChange?: Maybe<Scalars['Boolean']>;
};

export type Custom1RmFactorSetting = Setting & {
  __typename?: 'Custom1RMFactorSetting';
  default: Scalars['Int'];
  factor: Scalars['Int'];
  formula?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  waitingCodeToChange?: Maybe<Scalars['Boolean']>;
};

export type Dm = IBy & IHasText & IMessageRef & INotification & Ito & {
  __typename?: 'DM';
  by: Scalars['ID'];
  id: Scalars['ID'];
  inResponseTo?: Maybe<Scalars['ID']>;
  inResponseToMsg?: Maybe<Scalars['ID']>;
  isGlobal?: Maybe<Scalars['Boolean']>;
  msgid: Scalars['ID'];
  text: Scalars['String'];
  to: Scalars['ID'];
  when: Scalars['UTCDate'];
};

export type DobSetting = Setting & {
  __typename?: 'DOBSetting';
  dob?: Maybe<Scalars['YMD']>;
  id: Scalars['ID'];
  waitingCodeToChange?: Maybe<Scalars['Boolean']>;
};

export type DeleteAccountSetting = Setting & {
  __typename?: 'DeleteAccountSetting';
  id: Scalars['ID'];
  signature?: Maybe<Scalars['String']>;
  waitingCodeToChange?: Maybe<Scalars['Boolean']>;
};

export type DevConfigChanges = {
  __typename?: 'DevConfigChanges';
  changelog?: Maybe<Scalars['String']>;
  hash: Scalars['ID'];
};

export type DeveloperConfig = {
  __typename?: 'DeveloperConfig';
  confirmChanges?: Maybe<DevConfigChanges>;
  services?: Maybe<Array<DeveloperService>>;
};

export type DeveloperConfigSetting = Setting & {
  __typename?: 'DeveloperConfigSetting';
  config: DeveloperConfig;
  id: Scalars['ID'];
  waitingCodeToChange?: Maybe<Scalars['Boolean']>;
};

export type DeveloperService = {
  __typename?: 'DeveloperService';
  dbid?: Maybe<Scalars['ID']>;
  id: Scalars['String'];
  name: Scalars['String'];
  redirectUris: Array<Scalars['String']>;
  secret?: Maybe<Scalars['String']>;
  url: Scalars['String'];
};

export type EBestStats = {
  __typename?: 'EBestStats';
  eff?: Maybe<BestEStat>;
  int?: Maybe<BestEStat>;
  prsWxDorT?: Maybe<BestWxDorT>;
};

export type EBlock = {
  __typename?: 'EBlock';
  eid: Scalars['ID'];
  sets: Array<Maybe<Set>>;
};

export type ERef = {
  __typename?: 'ERef';
  best?: Maybe<EBestStats>;
  exercise: Exercise;
};

export type EblockPreview = {
  __typename?: 'EblockPreview';
  e: Exercise;
  r?: Maybe<Scalars['Int']>;
  w?: Maybe<Scalars['Float']>;
};

export type EmailSetting = Setting & {
  __typename?: 'EmailSetting';
  currentEmail: Scalars['String'];
  id: Scalars['ID'];
  waitingCodeToChange?: Maybe<Scalars['Boolean']>;
};

export type Estimated1Rm = BaseStat & {
  __typename?: 'Estimated1RM';
  bw?: Maybe<Weight>;
  by: Scalars['ID'];
  e: Scalars['ID'];
  originalw: Weight;
  reps: Scalars['Int'];
  w: Weight;
  ymd: Scalars['YMD'];
};

export type ExecExerciseResponse = ConfirmAction | Exercise;

export type Exercise = {
  __typename?: 'Exercise';
  id: Scalars['ID'];
  name: Scalars['String'];
  type?: Maybe<Scalars['String']>;
};

export type ExerciseStat = {
  __typename?: 'ExerciseStat';
  days: Scalars['Int'];
  e: Exercise;
  reps: Scalars['Int'];
};

export type FollowersCount = {
  __typename?: 'FollowersCount';
  has?: Maybe<Scalars['Boolean']>;
  total: Scalars['Int'];
};

export type ForumLike = IBy & IForum & IHasJOwner & IHasText & INotification & Ito & {
  __typename?: 'ForumLike';
  by: Scalars['ID'];
  dislike?: Maybe<Scalars['Boolean']>;
  forumSlug: Scalars['String'];
  id: Scalars['ID'];
  jowner: Scalars['ID'];
  postId: Scalars['ID'];
  text: Scalars['String'];
  threadId: Scalars['ID'];
  threadSlug: Scalars['String'];
  to: Scalars['ID'];
  when: Scalars['UTCDate'];
  ymd: Scalars['YMD'];
};

export type ForumMessage = {
  __typename?: 'ForumMessage';
  dislikes?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  likes?: Maybe<Scalars['Int']>;
  message: Scalars['String'];
  note?: Maybe<Scalars['String']>;
  parentId?: Maybe<Scalars['ID']>;
  replies?: Maybe<Scalars['Int']>;
  sectionId?: Maybe<Scalars['ID']>;
  threadId?: Maybe<Scalars['ID']>;
  user: Scalars['ID'];
  when: Scalars['UTCDate'];
};

export type ForumNotification = IBy & IForum & IHasJOwner & IHasText & INotification & Ito & {
  __typename?: 'ForumNotification';
  by: Scalars['ID'];
  forumSlug: Scalars['String'];
  id: Scalars['ID'];
  isMention?: Maybe<Scalars['Boolean']>;
  jowner: Scalars['ID'];
  postId: Scalars['ID'];
  text: Scalars['String'];
  threadId: Scalars['ID'];
  threadSlug: Scalars['String'];
  to: Scalars['ID'];
  when: Scalars['UTCDate'];
  ymd: Scalars['YMD'];
};

export type ForumRole = {
  __typename?: 'ForumRole';
  all?: Maybe<Scalars['Boolean']>;
  can?: Maybe<Array<Scalars['String']>>;
  id: Scalars['ID'];
  title: Scalars['String'];
};

export type ForumSection = {
  __typename?: 'ForumSection';
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  replies?: Maybe<Scalars['Int']>;
  slug: Scalars['String'];
  threads?: Maybe<Scalars['Int']>;
};

export type ForumStatus = {
  __typename?: 'ForumStatus';
  posts?: Maybe<Scalars['Int']>;
  role?: Maybe<ForumRole>;
};

export enum Gender {
  Female = 'FEMALE',
  Male = 'MALE'
}

export type Heavyest = BaseStat & {
  __typename?: 'Heavyest';
  bw?: Maybe<Weight>;
  by: Scalars['ID'];
  e: Scalars['ID'];
  reps: Scalars['Int'];
  w: Weight;
  ymd: Scalars['YMD'];
};

export type IBy = {
  by: Scalars['ID'];
};

export type IForum = {
  forumSlug: Scalars['String'];
  threadId: Scalars['ID'];
  threadSlug: Scalars['String'];
};

export type IHasJOwner = {
  jowner: Scalars['ID'];
  ymd: Scalars['YMD'];
};

export type IHasMessageId = {
  msgid: Scalars['ID'];
};

export type IHasText = {
  text: Scalars['String'];
};

export type IMessageRef = {
  inResponseTo?: Maybe<Scalars['ID']>;
  inResponseToMsg?: Maybe<Scalars['ID']>;
  msgid: Scalars['ID'];
};

export type INotification = {
  id: Scalars['ID'];
  when: Scalars['UTCDate'];
};

export type Ito = {
  to: Scalars['ID'];
};

export type Inbox = {
  __typename?: 'Inbox';
  notifications?: Maybe<Array<Notification>>;
  referencedUsers?: Maybe<Array<User>>;
};

export type JComment = IBy & IHasJOwner & IHasText & IMessageRef & INotification & Ito & {
  __typename?: 'JComment';
  by: Scalars['ID'];
  id: Scalars['ID'];
  inResponseTo?: Maybe<Scalars['ID']>;
  inResponseToMsg?: Maybe<Scalars['ID']>;
  jowner: Scalars['ID'];
  msgid: Scalars['ID'];
  text: Scalars['String'];
  to: Scalars['ID'];
  when: Scalars['UTCDate'];
  ymd: Scalars['YMD'];
};

export type JEditorBwTag = {
  __typename?: 'JEditorBWTag';
  bw?: Maybe<Scalars['Float']>;
};

export type JEditorData = {
  __typename?: 'JEditorData';
  baseBW?: Maybe<Scalars['Float']>;
  did?: Maybe<Array<Maybe<JeditorRow>>>;
  etags: Array<Maybe<Scalars['String']>>;
  exercises: Array<Maybe<ExerciseStat>>;
  utags?: Maybe<Array<Maybe<UTag>>>;
};

export type JEditorDayTag = {
  __typename?: 'JEditorDayTag';
  on: Scalars['YMD'];
};

export type JEditorEBlock = {
  __typename?: 'JEditorEBlock';
  e?: Maybe<Scalars['Int']>;
  sets?: Maybe<Array<Maybe<JEditorErow>>>;
};

export type JEditorErow = {
  __typename?: 'JEditorEROW';
  c?: Maybe<Scalars['String']>;
  d?: Maybe<Scalars['Int']>;
  dunit?: Maybe<Scalars['String']>;
  lb?: Maybe<Scalars['Int']>;
  r?: Maybe<Scalars['Int']>;
  rpe?: Maybe<Scalars['Float']>;
  s?: Maybe<Scalars['Int']>;
  t?: Maybe<Scalars['Int']>;
  type?: Maybe<Scalars['Int']>;
  usebw?: Maybe<Scalars['Int']>;
  v?: Maybe<Scalars['Float']>;
};

export type JEditorNewExercise = {
  __typename?: 'JEditorNewExercise';
  newExercise: Scalars['String'];
};

export type JEditorText = {
  __typename?: 'JEditorText';
  text?: Maybe<Scalars['String']>;
};

export type JEditorUTag = {
  __typename?: 'JEditorUTag';
  tag?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  value?: Maybe<Scalars['Int']>;
};

export type JLog = {
  __typename?: 'JLog';
  bw?: Maybe<Scalars['Float']>;
  eblocks?: Maybe<Array<Maybe<EBlock>>>;
  exercises?: Maybe<Array<Maybe<ERef>>>;
  fromMobile?: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  log?: Maybe<Scalars['String']>;
  utags?: Maybe<Array<Maybe<UTag>>>;
  utagsValues?: Maybe<Array<Maybe<UTagValue>>>;
};

export type JRangeData = {
  __typename?: 'JRangeData';
  days?: Maybe<Array<Maybe<JRangeDayData>>>;
  exercises: Array<Maybe<Exercise>>;
  from?: Maybe<Scalars['YMD']>;
  to?: Maybe<Scalars['YMD']>;
  utags?: Maybe<UTagsUsed>;
};

export type JRangeDayData = {
  __typename?: 'JRangeDayData';
  did?: Maybe<Array<Maybe<EBlock>>>;
  on?: Maybe<Scalars['YMD']>;
};

export type JeditorRow = JEditorBwTag | JEditorDayTag | JEditorEBlock | JEditorNewExercise | JEditorText | UTagValue;

export type LikeOnDm = IBy & IHasMessageId & IHasText & INotification & Ito & {
  __typename?: 'LikeOnDM';
  by: Scalars['ID'];
  id: Scalars['ID'];
  msgid: Scalars['ID'];
  text: Scalars['String'];
  to: Scalars['ID'];
  when: Scalars['UTCDate'];
};

export type LikeOnJComment = IBy & IHasJOwner & IHasMessageId & IHasText & INotification & Ito & {
  __typename?: 'LikeOnJComment';
  by: Scalars['ID'];
  id: Scalars['ID'];
  jowner: Scalars['ID'];
  msgid: Scalars['ID'];
  text: Scalars['String'];
  to: Scalars['ID'];
  when: Scalars['UTCDate'];
  ymd: Scalars['YMD'];
};

export type LikeOnLog = IBy & IHasJOwner & INotification & {
  __typename?: 'LikeOnLog';
  by: Scalars['ID'];
  id: Scalars['ID'];
  jowner: Scalars['ID'];
  when: Scalars['UTCDate'];
  ymd: Scalars['YMD'];
};

export enum MessageType {
  Dm = 'DM',
  Global = 'GLOBAL',
  Jcomment = 'JCOMMENT',
  Reply = 'REPLY'
}

export type Messages = {
  __typename?: 'Messages';
  messages?: Maybe<Array<Maybe<ForumMessage>>>;
  users?: Maybe<Array<Maybe<User>>>;
};

export type MostVolume = BaseStat & {
  __typename?: 'MostVolume';
  bw?: Maybe<Weight>;
  by: Scalars['ID'];
  e: Scalars['ID'];
  totalReps: Scalars['Int'];
  w: Weight;
};

export type Mutation = {
  __typename?: 'Mutation';
  _?: Maybe<Scalars['String']>;
  deleteAvatar?: Maybe<Scalars['Boolean']>;
  deleteForumMessage?: Maybe<Scalars['Boolean']>;
  deleteMessage?: Maybe<Scalars['Boolean']>;
  deleteTweet?: Maybe<Scalars['Boolean']>;
  dislikeForumMessage: Scalars['ID'];
  execBulkExercises?: Maybe<Scalars['Boolean']>;
  execExercise?: Maybe<ExecExerciseResponse>;
  follow?: Maybe<Scalars['Boolean']>;
  forgot: Scalars['Boolean'];
  likeForumMessage: Scalars['ID'];
  likeJournalLog: Scalars['ID'];
  likeMessage: Scalars['ID'];
  login: Scalars['String'];
  loginWithFirebase: Scalars['String'];
  loginWithGoogle: Scalars['String'];
  postForumMessage?: Maybe<Scalars['ID']>;
  saveJEditor?: Maybe<Scalars['Boolean']>;
  sendMessage?: Maybe<SendMessageResult>;
  sendVerificationCode?: Maybe<UserSetting>;
  setForumPostNote?: Maybe<Scalars['Boolean']>;
  setSetting?: Maybe<UserSetting>;
  setTweet?: Maybe<Scalars['Boolean']>;
  signup: Scalars['Boolean'];
  unsubFromEmails?: Maybe<Scalars['Boolean']>;
  uploadAvatar: Scalars['String'];
  verifySignup: Scalars['String'];
};


export type MutationDeleteForumMessageArgs = {
  id?: InputMaybe<Scalars['ID']>;
  why?: InputMaybe<Scalars['String']>;
};


export type MutationDeleteMessageArgs = {
  id?: InputMaybe<Scalars['ID']>;
};


export type MutationDeleteTweetArgs = {
  id?: InputMaybe<Scalars['ID']>;
};


export type MutationDislikeForumMessageArgs = {
  target: Scalars['ID'];
};


export type MutationExecBulkExercisesArgs = {
  eids: Array<Scalars['ID']>;
  mode: BulkMode;
};


export type MutationExecExerciseArgs = {
  confirms?: InputMaybe<Scalars['ID']>;
  id?: InputMaybe<Scalars['ID']>;
  name?: InputMaybe<Scalars['String']>;
};


export type MutationFollowArgs = {
  not?: InputMaybe<Scalars['Boolean']>;
  uid: Scalars['ID'];
};


export type MutationForgotArgs = {
  uore: Scalars['String'];
};


export type MutationLikeForumMessageArgs = {
  target: Scalars['ID'];
};


export type MutationLikeJournalLogArgs = {
  target: Scalars['ID'];
};


export type MutationLikeMessageArgs = {
  target: Scalars['ID'];
};


export type MutationLoginArgs = {
  p: Scalars['String'];
  u: Scalars['String'];
};


export type MutationLoginWithFirebaseArgs = {
  isf?: InputMaybe<Scalars['Int']>;
  token: Scalars['String'];
  uname?: InputMaybe<Scalars['String']>;
  usekg?: InputMaybe<Scalars['Int']>;
};


export type MutationLoginWithGoogleArgs = {
  isf?: InputMaybe<Scalars['Int']>;
  jwt: Scalars['String'];
  uname?: InputMaybe<Scalars['String']>;
  usekg?: InputMaybe<Scalars['Int']>;
};


export type MutationPostForumMessageArgs = {
  message: Scalars['String'];
  parentId?: InputMaybe<Scalars['ID']>;
  sectionId: Scalars['ID'];
};


export type MutationSaveJEditorArgs = {
  defaultDate: Scalars['YMD'];
  rows?: InputMaybe<Array<InputMaybe<Scalars['JEditorSaveRow']>>>;
};


export type MutationSendMessageArgs = {
  message: Scalars['String'];
  target: Scalars['ID'];
  type: MessageType;
};


export type MutationSendVerificationCodeArgs = {
  code: Scalars['String'];
  id: Scalars['ID'];
};


export type MutationSetForumPostNoteArgs = {
  messageId: Scalars['ID'];
  note: Scalars['String'];
};


export type MutationSetSettingArgs = {
  id: Scalars['ID'];
  value?: InputMaybe<Scalars['SettingValue']>;
};


export type MutationSetTweetArgs = {
  id?: InputMaybe<Scalars['ID']>;
  type?: InputMaybe<TweetType>;
};


export type MutationSignupArgs = {
  email: Scalars['String'];
  isf: Scalars['Int'];
  pass: Scalars['String'];
  uname: Scalars['String'];
  usekg: Scalars['Int'];
};


export type MutationUnsubFromEmailsArgs = {
  token?: InputMaybe<Scalars['String']>;
};


export type MutationUploadAvatarArgs = {
  file: Scalars['Upload'];
};


export type MutationVerifySignupArgs = {
  code: Scalars['String'];
};

export type Notification = Dm | ForumLike | ForumNotification | JComment | LikeOnDm | LikeOnJComment | LikeOnLog | StartedFollowing | SystemNotification;

export enum OAuthAction {
  Error = 'ERROR',
  Replace = 'REPLACE'
}

export type OfficialExercise = {
  __typename?: 'OfficialExercise';
  coolxbw?: Maybe<Scalars['Float']>;
  id: Scalars['ID'];
  tag: Scalars['String'];
  variants: Array<Maybe<Scalars['String']>>;
};

export type Option = {
  __typename?: 'Option';
  i: Scalars['Int'];
  name: Scalars['String'];
};

export type OptionSetting = Setting & {
  __typename?: 'OptionSetting';
  i?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  options?: Maybe<Array<Maybe<Option>>>;
  waitingCodeToChange?: Maybe<Scalars['Boolean']>;
};

export type Pr = {
  __typename?: 'PR';
  a2bw?: Maybe<Scalars['Float']>;
  bw?: Maybe<Scalars['Float']>;
  lb: Scalars['Int'];
  r: Scalars['Int'];
  w: Scalars['Float'];
  when: Scalars['YMD'];
};

export type PrHistory = {
  __typename?: 'PRHistory';
  exercise: Exercise;
  prs?: Maybe<Array<Maybe<Pr>>>;
  setsOf?: Maybe<Array<Maybe<RepStat>>>;
  totalWorkouts: Scalars['Int'];
  wxdotPRS?: Maybe<WxDotpRs>;
};

export type Query = {
  __typename?: 'Query';
  alsoposted?: Maybe<Array<Maybe<User>>>;
  communityStats?: Maybe<CommunityStats>;
  downloadLogs?: Maybe<JEditorData>;
  /** Returns all the available achievements that the system recognizes/has. */
  getAchievements?: Maybe<Array<Maybe<Achievement>>>;
  /** Returns all the achievements that this user has up to that particular date. */
  getAchievementsStateOf?: Maybe<Array<Maybe<AchievementState>>>;
  getActiveSupporters?: Maybe<Array<Maybe<Supporter>>>;
  getActivityFeed?: Maybe<Array<Maybe<UCard>>>;
  getAllPublicInteractionsInbox?: Maybe<Inbox>;
  getAnnouncements?: Maybe<Array<Maybe<SystemNotification>>>;
  getCalendarDays?: Maybe<Array<Maybe<Scalars['CalendarDayKey']>>>;
  getDate?: Maybe<Scalars['String']>;
  getExercises?: Maybe<Array<Maybe<ExerciseStat>>>;
  getFollowers?: Maybe<Array<Maybe<User>>>;
  getFollowersCount: FollowersCount;
  getFollowing?: Maybe<Array<Maybe<User>>>;
  getForumMessages?: Maybe<Messages>;
  getForumPostIndex: Scalars['Int'];
  getForumRolesDescription?: Maybe<Array<Maybe<RoleDescriptor>>>;
  getForumSections?: Maybe<Array<Maybe<ForumSection>>>;
  getInbox?: Maybe<Inbox>;
  getLogInbox?: Maybe<Inbox>;
  getNotifications?: Maybe<Inbox>;
  getPRsOf?: Maybe<PrHistory>;
  getSession?: Maybe<SessionInfo>;
  getSupporters?: Maybe<Array<Maybe<Supporter>>>;
  getThreadMessages?: Maybe<Messages>;
  getTwitterChallenges?: Maybe<Array<Maybe<TweetChallenge>>>;
  getTwitterChallengesStates?: Maybe<Array<Maybe<TweetState>>>;
  getUserSettings: Array<Maybe<UserSetting>>;
  getVideos?: Maybe<Array<Maybe<Video>>>;
  getYearOverview?: Maybe<Array<Maybe<Scalars['Int']>>>;
  getYearsLogged?: Maybe<Array<Maybe<Scalars['Int']>>>;
  jday?: Maybe<JLog>;
  jeditor?: Maybe<JEditorData>;
  jrange?: Maybe<JRangeData>;
  officialExercises: Array<Maybe<OfficialExercise>>;
  sbdStats?: Maybe<SbdStats>;
  totalJournals: Scalars['Int'];
  userBasicInfo?: Maybe<Array<User>>;
  userInfo: UserInfo;
};


export type QueryAlsopostedArgs = {
  ymd?: InputMaybe<Scalars['YMD']>;
};


export type QueryCommunityStatsArgs = {
  etype: Scalars['String'];
  gender?: InputMaybe<Gender>;
};


export type QueryGetAchievementsStateOfArgs = {
  asOfThisYMD: Scalars['YYYYMMDD'];
  uid: Scalars['ID'];
};


export type QueryGetActivityFeedArgs = {
  newerThan?: InputMaybe<Scalars['String']>;
  olderThan?: InputMaybe<Scalars['String']>;
  type: ActivityFeedType;
};


export type QueryGetAllPublicInteractionsInboxArgs = {
  newerThan?: InputMaybe<Scalars['UTCDate']>;
  olderThan?: InputMaybe<Scalars['UTCDate']>;
};


export type QueryGetAnnouncementsArgs = {
  limit: Scalars['Int'];
  olderThan?: InputMaybe<Scalars['UTCDate']>;
};


export type QueryGetCalendarDaysArgs = {
  from: Scalars['YYYYMMDD'];
  to: Scalars['YYYYMMDD'];
  uid: Scalars['ID'];
};


export type QueryGetExercisesArgs = {
  uid: Scalars['ID'];
};


export type QueryGetFollowersArgs = {
  uid: Scalars['ID'];
};


export type QueryGetFollowersCountArgs = {
  has?: InputMaybe<Scalars['ID']>;
  uid: Scalars['ID'];
};


export type QueryGetFollowingArgs = {
  uid: Scalars['ID'];
};


export type QueryGetForumMessagesArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  olderThan?: InputMaybe<Scalars['UTCDate']>;
  sectionId?: InputMaybe<Scalars['ID']>;
};


export type QueryGetForumPostIndexArgs = {
  postId: Scalars['ID'];
};


export type QueryGetInboxArgs = {
  dmsWithUID?: InputMaybe<Scalars['ID']>;
  newerThan?: InputMaybe<Scalars['UTCDate']>;
  olderThan?: InputMaybe<Scalars['UTCDate']>;
};


export type QueryGetLogInboxArgs = {
  logid: Scalars['ID'];
  newerThan?: InputMaybe<Scalars['UTCDate']>;
  olderThan?: InputMaybe<Scalars['UTCDate']>;
};


export type QueryGetNotificationsArgs = {
  newerThan?: InputMaybe<Scalars['UTCDate']>;
  olderThan?: InputMaybe<Scalars['UTCDate']>;
};


export type QueryGetPRsOfArgs = {
  eid: Scalars['ID'];
  till?: InputMaybe<Scalars['YMD']>;
};


export type QueryGetThreadMessagesArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  messageId?: InputMaybe<Scalars['ID']>;
  offset?: InputMaybe<Scalars['Int']>;
};


export type QueryGetVideosArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  olderThan?: InputMaybe<Scalars['UTCDate']>;
};


export type QueryGetYearOverviewArgs = {
  uid: Scalars['ID'];
  year: Scalars['Int'];
};


export type QueryGetYearsLoggedArgs = {
  uid: Scalars['ID'];
};


export type QueryJdayArgs = {
  uid: Scalars['ID'];
  ymd?: InputMaybe<Scalars['YMD']>;
};


export type QueryJeditorArgs = {
  range?: InputMaybe<Scalars['Int']>;
  ymd?: InputMaybe<Scalars['YMD']>;
};


export type QueryJrangeArgs = {
  range: Scalars['Int'];
  uid: Scalars['ID'];
  ymd: Scalars['YMD'];
};


export type QueryUserBasicInfoArgs = {
  of?: InputMaybe<Scalars['ID']>;
  ofThese?: InputMaybe<Array<Scalars['ID']>>;
};


export type QueryUserInfoArgs = {
  uname: Scalars['String'];
};

export type RpeSetting = Setting & {
  __typename?: 'RPESetting';
  defaults?: Maybe<Array<Maybe<Scalars['SettingValue']>>>;
  id: Scalars['ID'];
  overrides?: Maybe<Array<Maybe<Scalars['SettingValue']>>>;
  waitingCodeToChange?: Maybe<Scalars['Boolean']>;
};

export type RepStat = {
  __typename?: 'RepStat';
  count: Scalars['Int'];
  r: Scalars['Int'];
};

export enum Role {
  Admin = 'ADMIN',
  RegisteredUser = 'REGISTERED_USER'
}

export type RoleDescriptor = {
  __typename?: 'RoleDescriptor';
  description: Scalars['String'];
  key: Scalars['ID'];
  title: Scalars['String'];
};

export type SbdStat = {
  __typename?: 'SBDStat';
  graph?: Maybe<Array<Scalars['SBDSlot']>>;
  graphAge?: Maybe<Array<Maybe<Scalars['SBDSlot']>>>;
  wclass: WeightClass;
};

export type SbdStats = {
  __typename?: 'SBDStats';
  ageClasses?: Maybe<Array<Maybe<Scalars['String']>>>;
  date: Scalars['String'];
  perclass?: Maybe<Array<Maybe<SbdStat>>>;
  total: Scalars['Int'];
};

export type SendMessageResult = {
  __typename?: 'SendMessageResult';
  id: Scalars['ID'];
  inResponseTo?: Maybe<Scalars['ID']>;
  inResponseToMsg?: Maybe<Scalars['ID']>;
  msgid: Scalars['ID'];
  when: Scalars['UTCDate'];
};

export type SessionInfo = {
  __typename?: 'SessionInfo';
  forum?: Maybe<ForumStatus>;
  time?: Maybe<Scalars['String']>;
  user: User;
};

export type Set = {
  __typename?: 'Set';
  c?: Maybe<Scalars['String']>;
  d?: Maybe<Scalars['Int']>;
  dunit?: Maybe<Scalars['String']>;
  eff?: Maybe<Scalars['Float']>;
  est1rm?: Maybe<Scalars['Float']>;
  force?: Maybe<Scalars['Float']>;
  int?: Maybe<Scalars['Float']>;
  lb?: Maybe<Scalars['Int']>;
  pr?: Maybe<Scalars['Int']>;
  r?: Maybe<Scalars['Float']>;
  rpe?: Maybe<Scalars['Float']>;
  s?: Maybe<Scalars['Float']>;
  speed?: Maybe<Scalars['Float']>;
  t?: Maybe<Scalars['Int']>;
  type?: Maybe<Scalars['Int']>;
  ubw?: Maybe<Scalars['Int']>;
  w?: Maybe<Scalars['Float']>;
};

export type Setting = {
  id: Scalars['ID'];
  waitingCodeToChange?: Maybe<Scalars['Boolean']>;
};

export type SocialMediasSetting = Setting & {
  __typename?: 'SocialMediasSetting';
  id: Scalars['ID'];
  links?: Maybe<Array<Maybe<Scalars['String']>>>;
  waitingCodeToChange?: Maybe<Scalars['Boolean']>;
};

export type StartedFollowing = IBy & INotification & Ito & {
  __typename?: 'StartedFollowing';
  by: Scalars['ID'];
  id: Scalars['ID'];
  to: Scalars['ID'];
  when: Scalars['UTCDate'];
};

export type Supporter = {
  __typename?: 'Supporter';
  user: User;
  when?: Maybe<Scalars['String']>;
};

export type SupporterStatus = Setting & {
  __typename?: 'SupporterStatus';
  daysLeftAsActive: Scalars['Int'];
  id: Scalars['ID'];
  slvl: Scalars['Float'];
  waitingCodeToChange?: Maybe<Scalars['Boolean']>;
};

export type SystemNotification = IHasText & INotification & {
  __typename?: 'SystemNotification';
  id: Scalars['ID'];
  text: Scalars['String'];
  type?: Maybe<SystemNotificationType>;
  when: Scalars['UTCDate'];
};

export enum SystemNotificationType {
  Error = 'error',
  Info = 'info',
  Warning = 'warning'
}

export type TweetChallenge = {
  __typename?: 'TweetChallenge';
  description: Scalars['String'];
  title: Scalars['String'];
  type: TweetType;
};

export type TweetState = {
  __typename?: 'TweetState';
  fecha: Scalars['UTCDate'];
  granted?: Maybe<Scalars['Boolean']>;
  status?: Maybe<Scalars['String']>;
  tweet: Scalars['ID'];
  type: TweetType;
};

export enum TweetType {
  AsDonation = 'AS_DONATION',
  AsDonation2 = 'AS_DONATION2'
}

export type UCard = {
  __typename?: 'UCard';
  andXmore?: Maybe<Scalars['Int']>;
  itemsLeftAfterThis?: Maybe<Scalars['Int']>;
  media?: Maybe<Scalars['String']>;
  posted?: Maybe<Scalars['String']>;
  text?: Maybe<Scalars['String']>;
  user?: Maybe<User>;
  utags?: Maybe<UTagsUsed>;
  when?: Maybe<Scalars['String']>;
  workoutPreview?: Maybe<Array<Maybe<EblockPreview>>>;
};

export type UTag = {
  __typename?: 'UTag';
  automatic?: Maybe<Scalars['Boolean']>;
  id?: Maybe<Scalars['ID']>;
  name: Scalars['String'];
};

export type UTagValue = {
  __typename?: 'UTagValue';
  id?: Maybe<Scalars['ID']>;
  logid?: Maybe<Scalars['ID']>;
  tagid: Scalars['ID'];
  type: Scalars['String'];
  value: Scalars['String'];
  ymd?: Maybe<Scalars['YMD']>;
};

export type UTagsUsed = {
  __typename?: 'UTagsUsed';
  tags?: Maybe<Array<Maybe<UTag>>>;
  values?: Maybe<Array<Maybe<UTagValue>>>;
};

export type UnitValueWhen = {
  __typename?: 'UnitValueWhen';
  unit: Scalars['String'];
  val: Scalars['Float'];
  when: Scalars['YMD'];
};

export type User = {
  __typename?: 'User';
  age?: Maybe<Scalars['Int']>;
  avatarhash: Scalars['String'];
  bw?: Maybe<Scalars['Float']>;
  cc?: Maybe<Scalars['String']>;
  custom1RM?: Maybe<Scalars['Int']>;
  email?: Maybe<Scalars['String']>;
  est1RMFactor?: Maybe<Scalars['Int']>;
  estimate1RMFormula?: Maybe<Scalars['String']>;
  forumRole?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isf?: Maybe<Scalars['Int']>;
  joined?: Maybe<Scalars['String']>;
  jranges?: Maybe<Array<Maybe<Scalars['Int']>>>;
  private?: Maybe<Scalars['Int']>;
  sleft?: Maybe<Scalars['Int']>;
  slvl?: Maybe<Scalars['Float']>;
  socialLinks?: Maybe<Array<Maybe<Scalars['String']>>>;
  sok?: Maybe<Scalars['Int']>;
  uname: Scalars['String'];
  usekg?: Maybe<Scalars['Int']>;
};

export type UserInfo = {
  __typename?: 'UserInfo';
  best3?: Maybe<Array<BestLift>>;
  daysLogged: Scalars['Int'];
  forum?: Maybe<ForumStatus>;
  user: User;
};

export type UserSetting = BlockUsersSetting | CcSetting | ConnectedServicesSetting | Custom1RmFactorSetting | DobSetting | DeleteAccountSetting | DeveloperConfigSetting | EmailSetting | OptionSetting | RpeSetting | SocialMediasSetting | SupporterStatus | UsernameSetting | VoidSetting;

export type UsernameSetting = Setting & {
  __typename?: 'UsernameSetting';
  id: Scalars['ID'];
  uname: Scalars['String'];
  waitingCodeToChange?: Maybe<Scalars['Boolean']>;
};

export type Video = {
  __typename?: 'Video';
  link: Scalars['String'];
  logid: Scalars['ID'];
  posted: Scalars['String'];
  user: User;
  when: Scalars['String'];
};

export type VoidSetting = Setting & {
  __typename?: 'VoidSetting';
  id: Scalars['ID'];
  waitingCodeToChange?: Maybe<Scalars['Boolean']>;
};

export type Weight = {
  __typename?: 'Weight';
  lb: Scalars['Int'];
  v: Scalars['Float'];
};

export type WeightClass = {
  __typename?: 'WeightClass';
  male: Scalars['Boolean'];
  max: Scalars['Float'];
  min: Scalars['Float'];
  name: Scalars['String'];
};

export type WxDotpRs = {
  __typename?: 'WxDOTPRs';
  DxTPR?: Maybe<Array<Maybe<Scalars['Int']>>>;
  WxD_PRs?: Maybe<Array<Maybe<Scalars['Int']>>>;
  WxT_PRs?: Maybe<Array<Maybe<Scalars['Int']>>>;
  erowi2ymdi?: Maybe<Array<Maybe<Scalars['Int']>>>;
  erows?: Maybe<Array<Maybe<Set>>>;
  maxDistancePR?: Maybe<Array<Maybe<Scalars['Int']>>>;
  maxForcePR?: Maybe<Array<Maybe<Scalars['Int']>>>;
  maxTimePR?: Maybe<Array<Maybe<Scalars['Int']>>>;
  minDistancePR?: Maybe<Array<Maybe<Scalars['Int']>>>;
  minTimePR?: Maybe<Array<Maybe<Scalars['Int']>>>;
  speedPR?: Maybe<Array<Maybe<Scalars['Int']>>>;
  ymds?: Maybe<Array<Maybe<Scalars['YMD']>>>;
};

export type WxDpr = {
  __typename?: 'WxDPR';
  a2bw?: Maybe<Scalars['Float']>;
  d: Scalars['Float'];
  dunit: Scalars['String'];
  lb?: Maybe<Scalars['Int']>;
  t?: Maybe<Scalars['Float']>;
  w?: Maybe<Scalars['Float']>;
  when: Scalars['YMD'];
};

export type GetAchievementsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAchievementsQuery = { __typename?: 'Query', getAchievements?: Array<{ __typename?: 'Achievement', id: string, description: string, name: string } | null> | null };

export type GetAchievementsStateOfQueryVariables = Exact<{
  uid: Scalars['ID'];
  asOfThisYmd: Scalars['YYYYMMDD'];
}>;


export type GetAchievementsStateOfQuery = { __typename?: 'Query', getAchievementsStateOf?: Array<{ __typename?: 'AchievementState', aid: string, gotit?: boolean | null, when?: any | null, note?: string | null } | null> | null };

type BaseFields_Estimated1Rm_Fragment = { __typename?: 'Estimated1RM', e: string, by: string, w: { __typename?: 'Weight', v: number, lb: number }, bw?: { __typename?: 'Weight', v: number, lb: number } | null };

type BaseFields_Heavyest_Fragment = { __typename?: 'Heavyest', e: string, by: string, w: { __typename?: 'Weight', v: number, lb: number }, bw?: { __typename?: 'Weight', v: number, lb: number } | null };

type BaseFields_MostVolume_Fragment = { __typename?: 'MostVolume', e: string, by: string, w: { __typename?: 'Weight', v: number, lb: number }, bw?: { __typename?: 'Weight', v: number, lb: number } | null };

export type BaseFieldsFragment = BaseFields_Estimated1Rm_Fragment | BaseFields_Heavyest_Fragment | BaseFields_MostVolume_Fragment;

export type GetOfficialExercisesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOfficialExercisesQuery = { __typename?: 'Query', officialExercises: Array<{ __typename?: 'OfficialExercise', id: string, tag: string, variants: Array<string | null>, coolxbw?: number | null } | null> };

export type GetSbdStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSbdStatsQuery = { __typename?: 'Query', sbdStats?: { __typename?: 'SBDStats', total: number, date: string, ageClasses?: Array<string | null> | null, perclass?: Array<{ __typename?: 'SBDStat', graph?: Array<any> | null, graphAge?: Array<any | null> | null, wclass: { __typename?: 'WeightClass', name: string, max: number, min: number, male: boolean } } | null> | null } | null };

export type GetCommunityStatsQueryVariables = Exact<{
  etype: Scalars['String'];
}>;


export type GetCommunityStatsQuery = { __typename?: 'Query', communityStats?: { __typename?: 'CommunityStats', title: string, scanFrecuency: string, timestamp?: any | null, heavyest?: Array<{ __typename?: 'Heavyest', ymd: any, reps: number, e: string, by: string, w: { __typename?: 'Weight', v: number, lb: number }, bw?: { __typename?: 'Weight', v: number, lb: number } | null } | null> | null, estimated?: Array<{ __typename?: 'Estimated1RM', reps: number, ymd: any, e: string, by: string, originalw: { __typename?: 'Weight', lb: number, v: number }, w: { __typename?: 'Weight', v: number, lb: number }, bw?: { __typename?: 'Weight', v: number, lb: number } | null } | null> | null, volume?: Array<{ __typename?: 'MostVolume', totalReps: number, e: string, by: string, w: { __typename?: 'Weight', v: number, lb: number }, bw?: { __typename?: 'Weight', v: number, lb: number } | null } | null> | null, exercises?: Array<{ __typename?: 'Exercise', id: string, type?: string | null, name: string } | null> | null, users?: Array<{ __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null } | null> | null } | null };

export type GetExercisesQueryVariables = Exact<{
  uid: Scalars['ID'];
}>;


export type GetExercisesQuery = { __typename?: 'Query', getExercises?: Array<{ __typename?: 'ExerciseStat', days: number, reps: number, e: { __typename?: 'Exercise', id: string, type?: string | null, name: string } } | null> | null };

export type GetPRsOfQueryVariables = Exact<{
  eid: Scalars['ID'];
  till?: InputMaybe<Scalars['YMD']>;
}>;


export type GetPRsOfQuery = { __typename?: 'Query', getPRsOf?: { __typename?: 'PRHistory', totalWorkouts: number, exercise: { __typename?: 'Exercise', id: string, type?: string | null, name: string }, setsOf?: Array<{ __typename?: 'RepStat', r: number, count: number } | null> | null, prs?: Array<{ __typename?: 'PR', w: number, r: number, lb: number, when: any, bw?: number | null, a2bw?: number | null } | null> | null, wxdotPRS?: { __typename?: 'WxDOTPRs', ymds?: Array<any | null> | null, erowi2ymdi?: Array<number | null> | null, minDistancePR?: Array<number | null> | null, maxDistancePR?: Array<number | null> | null, maxTimePR?: Array<number | null> | null, minTimePR?: Array<number | null> | null, speedPR?: Array<number | null> | null, maxForcePR?: Array<number | null> | null, WxD_PRs?: Array<number | null> | null, WxT_PRs?: Array<number | null> | null, DxTPR?: Array<number | null> | null, erows?: Array<{ __typename?: 'Set', w?: number | null, r?: number | null, s?: number | null, lb?: number | null, ubw?: number | null, c?: string | null, rpe?: number | null, pr?: number | null, est1rm?: number | null, eff?: number | null, int?: number | null, type?: number | null, t?: number | null, d?: number | null, dunit?: string | null, speed?: number | null, force?: number | null } | null> | null } | null } | null };

export type ExecExerciseMutationVariables = Exact<{
  eid?: InputMaybe<Scalars['ID']>;
  ename?: InputMaybe<Scalars['String']>;
  confirms?: InputMaybe<Scalars['ID']>;
}>;


export type ExecExerciseMutation = { __typename?: 'Mutation', execExercise?: { __typename?: 'ConfirmAction', message: string, id: string } | { __typename?: 'Exercise', id: string, name: string, type?: string | null } | null };

export type ExecBulkExercisesMutationVariables = Exact<{
  eids: Array<Scalars['ID']> | Scalars['ID'];
  mode: BulkMode;
}>;


export type ExecBulkExercisesMutation = { __typename?: 'Mutation', execBulkExercises?: boolean | null };

export type GetFeedQueryVariables = Exact<{
  type: ActivityFeedType;
  olderThan?: InputMaybe<Scalars['String']>;
  newerThan?: InputMaybe<Scalars['String']>;
}>;


export type GetFeedQuery = { __typename?: 'Query', getActivityFeed?: Array<{ __typename?: 'UCard', when?: string | null, text?: string | null, andXmore?: number | null, posted?: string | null, media?: string | null, itemsLeftAfterThis?: number | null, user?: { __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null } | null, workoutPreview?: Array<{ __typename?: 'EblockPreview', r?: number | null, w?: number | null, e: { __typename?: 'Exercise', id: string, name: string, type?: string | null } } | null> | null, utags?: { __typename?: 'UTagsUsed', tags?: Array<{ __typename?: 'UTag', id?: string | null, name: string } | null> | null, values?: Array<{ __typename?: 'UTagValue', id?: string | null, tagid: string, type: string, value: string } | null> | null } | null } | null> | null };

export type GetForumMessagesQueryVariables = Exact<{
  sectionId?: InputMaybe<Scalars['ID']>;
  olderThan?: InputMaybe<Scalars['UTCDate']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type GetForumMessagesQuery = { __typename?: 'Query', getForumMessages?: { __typename?: 'Messages', messages?: Array<{ __typename?: 'ForumMessage', id: string, message: string, note?: string | null, parentId?: string | null, sectionId?: string | null, threadId?: string | null, user: string, when: any, replies?: number | null } | null> | null, users?: Array<{ __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null } | null> | null } | null };

export type GetThreadMessagesQueryVariables = Exact<{
  messageId?: InputMaybe<Scalars['ID']>;
  offset?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type GetThreadMessagesQuery = { __typename?: 'Query', getThreadMessages?: { __typename?: 'Messages', messages?: Array<{ __typename?: 'ForumMessage', id: string, message: string, note?: string | null, parentId?: string | null, sectionId?: string | null, user: string, when: any, likes?: number | null, dislikes?: number | null, replies?: number | null } | null> | null, users?: Array<{ __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null } | null> | null } | null };

export type GetForumSectionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetForumSectionsQuery = { __typename?: 'Query', getForumSections?: Array<{ __typename?: 'ForumSection', description?: string | null, id: string, name: string, slug: string, threads?: number | null, replies?: number | null } | null> | null };

export type GetForumPostIndexQueryVariables = Exact<{
  postId: Scalars['ID'];
}>;


export type GetForumPostIndexQuery = { __typename?: 'Query', getForumPostIndex: number };

export type PostForumMessageMutationVariables = Exact<{
  sectionId: Scalars['ID'];
  parentId?: InputMaybe<Scalars['ID']>;
  message: Scalars['String'];
}>;


export type PostForumMessageMutation = { __typename?: 'Mutation', postForumMessage?: string | null };

export type DeleteForumMessageMutationVariables = Exact<{
  id: Scalars['ID'];
  why?: InputMaybe<Scalars['String']>;
}>;


export type DeleteForumMessageMutation = { __typename?: 'Mutation', deleteForumMessage?: boolean | null };

export type GetForumRolesDescriptionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetForumRolesDescriptionQuery = { __typename?: 'Query', getForumRolesDescription?: Array<{ __typename?: 'RoleDescriptor', key: string, title: string, description: string } | null> | null };

export type SetForumMessageNoteMutationVariables = Exact<{
  messageId: Scalars['ID'];
  note: Scalars['String'];
}>;


export type SetForumMessageNoteMutation = { __typename?: 'Mutation', setForumPostNote?: boolean | null };

type NotificationFields_Dm_Fragment = { __typename: 'DM', id: string, when: any, by: string, to: string, msgid: string, inResponseTo?: string | null, inResponseToMsg?: string | null, text: string, isGlobal?: boolean | null };

type NotificationFields_ForumLike_Fragment = { __typename: 'ForumLike', id: string, when: any, jowner: string, ymd: any, by: string, to: string, text: string, forumSlug: string, threadId: string, threadSlug: string, dislike?: boolean | null, postId: string };

type NotificationFields_ForumNotification_Fragment = { __typename: 'ForumNotification', id: string, when: any, jowner: string, ymd: any, by: string, to: string, text: string, forumSlug: string, threadId: string, threadSlug: string, isMention?: boolean | null, postId: string };

type NotificationFields_JComment_Fragment = { __typename: 'JComment', id: string, when: any, jowner: string, ymd: any, by: string, to: string, msgid: string, inResponseTo?: string | null, inResponseToMsg?: string | null, text: string };

type NotificationFields_LikeOnDm_Fragment = { __typename: 'LikeOnDM', id: string, when: any, by: string, to: string, msgid: string, text: string };

type NotificationFields_LikeOnJComment_Fragment = { __typename: 'LikeOnJComment', id: string, when: any, jowner: string, ymd: any, by: string, to: string, msgid: string, text: string };

type NotificationFields_LikeOnLog_Fragment = { __typename: 'LikeOnLog', id: string, when: any, jowner: string, ymd: any, by: string };

type NotificationFields_StartedFollowing_Fragment = { __typename: 'StartedFollowing', id: string, when: any, by: string, to: string };

type NotificationFields_SystemNotification_Fragment = { __typename: 'SystemNotification', id: string, when: any, text: string, variant?: SystemNotificationType | null };

export type NotificationFieldsFragment = NotificationFields_Dm_Fragment | NotificationFields_ForumLike_Fragment | NotificationFields_ForumNotification_Fragment | NotificationFields_JComment_Fragment | NotificationFields_LikeOnDm_Fragment | NotificationFields_LikeOnJComment_Fragment | NotificationFields_LikeOnLog_Fragment | NotificationFields_StartedFollowing_Fragment | NotificationFields_SystemNotification_Fragment;

export type GetInboxQueryVariables = Exact<{
  olderThan?: InputMaybe<Scalars['UTCDate']>;
  newerThan?: InputMaybe<Scalars['UTCDate']>;
  dmsWithUID?: InputMaybe<Scalars['ID']>;
}>;


export type GetInboxQuery = { __typename?: 'Query', getInbox?: { __typename?: 'Inbox', referencedUsers?: Array<{ __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null }> | null, notifications?: Array<{ __typename: 'DM', id: string, when: any, by: string, to: string, msgid: string, inResponseTo?: string | null, inResponseToMsg?: string | null, text: string, isGlobal?: boolean | null } | { __typename: 'ForumLike', id: string, when: any, jowner: string, ymd: any, by: string, to: string, text: string, forumSlug: string, threadId: string, threadSlug: string, dislike?: boolean | null, postId: string } | { __typename: 'ForumNotification', id: string, when: any, jowner: string, ymd: any, by: string, to: string, text: string, forumSlug: string, threadId: string, threadSlug: string, isMention?: boolean | null, postId: string } | { __typename: 'JComment', id: string, when: any, jowner: string, ymd: any, by: string, to: string, msgid: string, inResponseTo?: string | null, inResponseToMsg?: string | null, text: string } | { __typename: 'LikeOnDM', id: string, when: any, by: string, to: string, msgid: string, text: string } | { __typename: 'LikeOnJComment', id: string, when: any, jowner: string, ymd: any, by: string, to: string, msgid: string, text: string } | { __typename: 'LikeOnLog', id: string, when: any, jowner: string, ymd: any, by: string } | { __typename: 'StartedFollowing', id: string, when: any, by: string, to: string } | { __typename: 'SystemNotification', id: string, when: any, text: string, variant?: SystemNotificationType | null }> | null } | null };

export type GetNotificationsQueryVariables = Exact<{
  olderThan?: InputMaybe<Scalars['UTCDate']>;
  newerThan?: InputMaybe<Scalars['UTCDate']>;
}>;


export type GetNotificationsQuery = { __typename?: 'Query', getNotifications?: { __typename?: 'Inbox', referencedUsers?: Array<{ __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null }> | null, notifications?: Array<{ __typename: 'DM', id: string, when: any, by: string, to: string, msgid: string, inResponseTo?: string | null, inResponseToMsg?: string | null, text: string, isGlobal?: boolean | null } | { __typename: 'ForumLike', id: string, when: any, jowner: string, ymd: any, by: string, to: string, text: string, forumSlug: string, threadId: string, threadSlug: string, dislike?: boolean | null, postId: string } | { __typename: 'ForumNotification', id: string, when: any, jowner: string, ymd: any, by: string, to: string, text: string, forumSlug: string, threadId: string, threadSlug: string, isMention?: boolean | null, postId: string } | { __typename: 'JComment', id: string, when: any, jowner: string, ymd: any, by: string, to: string, msgid: string, inResponseTo?: string | null, inResponseToMsg?: string | null, text: string } | { __typename: 'LikeOnDM', id: string, when: any, by: string, to: string, msgid: string, text: string } | { __typename: 'LikeOnJComment', id: string, when: any, jowner: string, ymd: any, by: string, to: string, msgid: string, text: string } | { __typename: 'LikeOnLog', id: string, when: any, jowner: string, ymd: any, by: string } | { __typename: 'StartedFollowing', id: string, when: any, by: string, to: string } | { __typename: 'SystemNotification', id: string, when: any, text: string, variant?: SystemNotificationType | null }> | null } | null };

export type GetAnnouncementsQueryVariables = Exact<{
  olderThan?: InputMaybe<Scalars['UTCDate']>;
  limit: Scalars['Int'];
}>;


export type GetAnnouncementsQuery = { __typename?: 'Query', getAnnouncements?: Array<{ __typename: 'SystemNotification', id: string, when: any, text: string, variant?: SystemNotificationType | null } | null> | null };

export type WxDoTFieldsFragment = { __typename?: 'Set', type?: number | null, t?: number | null, d?: number | null, dunit?: string | null };

export type WxDoTFieldsExtrasFragment = { __typename?: 'Set', speed?: number | null, force?: number | null };

export type SetFieldsFragment = { __typename?: 'Set', w?: number | null, r?: number | null, s?: number | null, lb?: number | null, ubw?: number | null, c?: string | null, rpe?: number | null, pr?: number | null, est1rm?: number | null, eff?: number | null, int?: number | null };

export type GetUserInfoQueryVariables = Exact<{
  userInfoUname: Scalars['String'];
}>;


export type GetUserInfoQuery = { __typename?: 'Query', userInfo: { __typename?: 'UserInfo', daysLogged: number, user: { __typename?: 'User', id: string, avatarhash: string, uname: string, cc?: string | null, slvl?: number | null, sok?: number | null, sleft?: number | null, age?: number | null, bw?: number | null, private?: number | null, isf?: number | null, joined?: string | null, usekg?: number | null, forumRole?: string | null, custom1RM?: number | null, est1RMFactor?: number | null, jranges?: Array<number | null> | null, estimate1RMFormula?: string | null, socialLinks?: Array<string | null> | null }, forum?: { __typename?: 'ForumStatus', posts?: number | null, role?: { __typename?: 'ForumRole', title: string } | null } | null, best3?: Array<{ __typename?: 'BestLift', w: number, e: { __typename?: 'Exercise', id: string, name: string, type?: string | null } }> | null } };

export type GetUserBasicInfoQueryVariables = Exact<{
  of?: InputMaybe<Scalars['ID']>;
  ofThese?: InputMaybe<Array<Scalars['ID']> | Scalars['ID']>;
}>;


export type GetUserBasicInfoQuery = { __typename?: 'Query', userBasicInfo?: Array<{ __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null }> | null };

export type GetCalendarDaysQueryVariables = Exact<{
  uid: Scalars['ID'];
  from: Scalars['YYYYMMDD'];
  to: Scalars['YYYYMMDD'];
}>;


export type GetCalendarDaysQuery = { __typename?: 'Query', getCalendarDays?: Array<any | null> | null };

export type GetYearOverviewQueryVariables = Exact<{
  uid: Scalars['ID'];
  year: Scalars['Int'];
}>;


export type GetYearOverviewQuery = { __typename?: 'Query', getYearOverview?: Array<number | null> | null, getYearsLogged?: Array<number | null> | null };

export type JDayQueryVariables = Exact<{
  uid: Scalars['ID'];
  ymd?: InputMaybe<Scalars['YMD']>;
}>;


export type JDayQuery = { __typename?: 'Query', jday?: { __typename?: 'JLog', id: string, log?: string | null, fromMobile?: boolean | null, bw?: number | null, eblocks?: Array<{ __typename?: 'EBlock', eid: string, sets: Array<{ __typename?: 'Set', w?: number | null, r?: number | null, s?: number | null, lb?: number | null, ubw?: number | null, c?: string | null, rpe?: number | null, pr?: number | null, est1rm?: number | null, eff?: number | null, int?: number | null, type?: number | null, t?: number | null, d?: number | null, dunit?: string | null, speed?: number | null, force?: number | null } | null> } | null> | null, exercises?: Array<{ __typename?: 'ERef', exercise: { __typename?: 'Exercise', id: string, name: string, type?: string | null }, best?: { __typename?: 'EBestStats', eff?: { __typename?: 'BestEStat', w: number, r: number, lb: number, when: any, bw?: number | null, est1rm?: number | null } | null, int?: { __typename?: 'BestEStat', w: number, r: number, lb: number, when: any, bw?: number | null } | null, prsWxDorT?: { __typename?: 'BestWxDorT', maxDistance?: { __typename?: 'UnitValueWhen', val: number, unit: string, when: any } | null, minDistance?: { __typename?: 'UnitValueWhen', val: number, unit: string, when: any } | null, topSpeed?: { __typename?: 'UnitValueWhen', val: number, unit: string, when: any } | null, minTime?: { __typename?: 'UnitValueWhen', val: number, unit: string, when: any } | null, maxTime?: { __typename?: 'UnitValueWhen', val: number, unit: string, when: any } | null, maxForce?: { __typename?: 'UnitValueWhen', val: number, unit: string, when: any } | null } | null } | null } | null> | null, utags?: Array<{ __typename?: 'UTag', id?: string | null, name: string } | null> | null, utagsValues?: Array<{ __typename?: 'UTagValue', id?: string | null, tagid: string, type: string, value: string, logid?: string | null } | null> | null } | null };

export type AlsoPostedQueryVariables = Exact<{
  ymd?: InputMaybe<Scalars['YMD']>;
}>;


export type AlsoPostedQuery = { __typename?: 'Query', alsoposted?: Array<{ __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null } | null> | null };

export type JeditorDataFieldsFragment = { __typename?: 'JEditorData', etags: Array<string | null>, baseBW?: number | null, exercises: Array<{ __typename?: 'ExerciseStat', days: number, reps: number, e: { __typename?: 'Exercise', id: string, name: string, type?: string | null } } | null>, utags?: Array<{ __typename?: 'UTag', id?: string | null, name: string } | null> | null, did?: Array<{ __typename?: 'JEditorBWTag', bw?: number | null } | { __typename?: 'JEditorDayTag', on: any } | { __typename?: 'JEditorEBlock', e?: number | null, sets?: Array<{ __typename?: 'JEditorEROW', usebw?: number | null, v?: number | null, c?: string | null, s?: number | null, r?: number | null, lb?: number | null, rpe?: number | null, t?: number | null, d?: number | null, dunit?: string | null, type?: number | null } | null> | null } | { __typename?: 'JEditorNewExercise' } | { __typename?: 'JEditorText', text?: string | null } | { __typename?: 'UTagValue', tagid: string, type: string, value: string } | null> | null };

export type GetJRangeQueryVariables = Exact<{
  uid: Scalars['ID'];
  ymd: Scalars['YMD'];
  range: Scalars['Int'];
}>;


export type GetJRangeQuery = { __typename?: 'Query', jrange?: { __typename?: 'JRangeData', from?: any | null, to?: any | null, exercises: Array<{ __typename?: 'Exercise', id: string, name: string, type?: string | null } | null>, days?: Array<{ __typename?: 'JRangeDayData', on?: any | null, did?: Array<{ __typename?: 'EBlock', eid: string, sets: Array<{ __typename?: 'Set', w?: number | null, r?: number | null, s?: number | null, lb?: number | null, ubw?: number | null, c?: string | null, rpe?: number | null, pr?: number | null, est1rm?: number | null, eff?: number | null, int?: number | null, type?: number | null, t?: number | null, d?: number | null, dunit?: string | null, speed?: number | null, force?: number | null } | null> } | null> | null } | null> | null, utags?: { __typename?: 'UTagsUsed', tags?: Array<{ __typename?: 'UTag', id?: string | null, name: string, automatic?: boolean | null } | null> | null, values?: Array<{ __typename?: 'UTagValue', tagid: string, ymd?: any | null, type: string, value: string } | null> | null } | null } | null };

export type GetJEditorDataQueryVariables = Exact<{
  ymd?: InputMaybe<Scalars['YMD']>;
  range?: InputMaybe<Scalars['Int']>;
}>;


export type GetJEditorDataQuery = { __typename?: 'Query', jeditor?: { __typename?: 'JEditorData', etags: Array<string | null>, baseBW?: number | null, exercises: Array<{ __typename?: 'ExerciseStat', days: number, reps: number, e: { __typename?: 'Exercise', id: string, name: string, type?: string | null } } | null>, utags?: Array<{ __typename?: 'UTag', id?: string | null, name: string } | null> | null, did?: Array<{ __typename?: 'JEditorBWTag', bw?: number | null } | { __typename?: 'JEditorDayTag', on: any } | { __typename?: 'JEditorEBlock', e?: number | null, sets?: Array<{ __typename?: 'JEditorEROW', usebw?: number | null, v?: number | null, c?: string | null, s?: number | null, r?: number | null, lb?: number | null, rpe?: number | null, t?: number | null, d?: number | null, dunit?: string | null, type?: number | null } | null> | null } | { __typename?: 'JEditorNewExercise' } | { __typename?: 'JEditorText', text?: string | null } | { __typename?: 'UTagValue', tagid: string, type: string, value: string } | null> | null } | null };

export type SaveJEditorMutationVariables = Exact<{
  rows?: InputMaybe<Array<InputMaybe<Scalars['JEditorSaveRow']>> | InputMaybe<Scalars['JEditorSaveRow']>>;
  defaultDate: Scalars['YMD'];
}>;


export type SaveJEditorMutation = { __typename?: 'Mutation', saveJEditor?: boolean | null };

export type DownloadLogsQueryVariables = Exact<{ [key: string]: never; }>;


export type DownloadLogsQuery = { __typename?: 'Query', downloadLogs?: { __typename?: 'JEditorData', etags: Array<string | null>, baseBW?: number | null, exercises: Array<{ __typename?: 'ExerciseStat', days: number, reps: number, e: { __typename?: 'Exercise', id: string, name: string, type?: string | null } } | null>, utags?: Array<{ __typename?: 'UTag', id?: string | null, name: string } | null> | null, did?: Array<{ __typename?: 'JEditorBWTag', bw?: number | null } | { __typename?: 'JEditorDayTag', on: any } | { __typename?: 'JEditorEBlock', e?: number | null, sets?: Array<{ __typename?: 'JEditorEROW', usebw?: number | null, v?: number | null, c?: string | null, s?: number | null, r?: number | null, lb?: number | null, rpe?: number | null, t?: number | null, d?: number | null, dunit?: string | null, type?: number | null } | null> | null } | { __typename?: 'JEditorNewExercise' } | { __typename?: 'JEditorText', text?: string | null } | { __typename?: 'UTagValue', tagid: string, type: string, value: string } | null> | null } | null };

export type GetFollowersQueryVariables = Exact<{
  of: Scalars['ID'];
  has?: InputMaybe<Scalars['ID']>;
}>;


export type GetFollowersQuery = { __typename?: 'Query', getFollowersCount: { __typename?: 'FollowersCount', has?: boolean | null, total: number } };

export type GetUsersFollowingQueryVariables = Exact<{
  who: Scalars['ID'];
}>;


export type GetUsersFollowingQuery = { __typename?: 'Query', getFollowers?: Array<{ __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null } | null> | null };

export type GetUsersFollowedByQueryVariables = Exact<{
  who: Scalars['ID'];
}>;


export type GetUsersFollowedByQuery = { __typename?: 'Query', getFollowing?: Array<{ __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null } | null> | null };

export type GetFollowInfoQueryVariables = Exact<{
  uid: Scalars['ID'];
}>;


export type GetFollowInfoQuery = { __typename?: 'Query', getFollowers?: Array<{ __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null } | null> | null, getFollowing?: Array<{ __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null } | null> | null };

export type LikeMessageMutationVariables = Exact<{
  target: Scalars['ID'];
}>;


export type LikeMessageMutation = { __typename?: 'Mutation', likeMessage: string };

export type LikeJournalLogMutationVariables = Exact<{
  target: Scalars['ID'];
}>;


export type LikeJournalLogMutation = { __typename?: 'Mutation', likeJournalLog: string };

export type LikeForumMessageMutationVariables = Exact<{
  target: Scalars['ID'];
}>;


export type LikeForumMessageMutation = { __typename?: 'Mutation', likeForumMessage: string };

export type DislikeForumMessageMutationVariables = Exact<{
  target: Scalars['ID'];
}>;


export type DislikeForumMessageMutation = { __typename?: 'Mutation', dislikeForumMessage: string };

export type FollowMutationVariables = Exact<{
  uid: Scalars['ID'];
  not?: InputMaybe<Scalars['Boolean']>;
}>;


export type FollowMutation = { __typename?: 'Mutation', follow?: boolean | null };

export type GetLogInboxQueryVariables = Exact<{
  olderThan?: InputMaybe<Scalars['UTCDate']>;
  newerThan?: InputMaybe<Scalars['UTCDate']>;
  logid: Scalars['ID'];
}>;


export type GetLogInboxQuery = { __typename?: 'Query', getLogInbox?: { __typename?: 'Inbox', referencedUsers?: Array<{ __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null }> | null, notifications?: Array<{ __typename: 'DM', id: string, when: any, by: string, to: string, msgid: string, inResponseTo?: string | null, inResponseToMsg?: string | null, text: string } | { __typename: 'ForumLike', id: string, when: any, jowner: string, ymd: any, by: string, to: string, text: string } | { __typename: 'ForumNotification', id: string, when: any, jowner: string, ymd: any, by: string, to: string, text: string } | { __typename: 'JComment', id: string, when: any, jowner: string, ymd: any, by: string, to: string, msgid: string, inResponseTo?: string | null, inResponseToMsg?: string | null, text: string } | { __typename: 'LikeOnDM', id: string, when: any, by: string, to: string, msgid: string, text: string } | { __typename: 'LikeOnJComment', id: string, when: any, jowner: string, ymd: any, by: string, to: string, msgid: string, text: string } | { __typename: 'LikeOnLog', id: string, when: any, jowner: string, ymd: any, by: string } | { __typename: 'StartedFollowing', id: string, when: any, by: string, to: string } | { __typename: 'SystemNotification', id: string, when: any, text: string, variant?: SystemNotificationType | null }> | null } | null };

export type GetPublicInteractionsInboxQueryVariables = Exact<{
  olderThan?: InputMaybe<Scalars['UTCDate']>;
  newerThan?: InputMaybe<Scalars['UTCDate']>;
}>;


export type GetPublicInteractionsInboxQuery = { __typename?: 'Query', getAllPublicInteractionsInbox?: { __typename?: 'Inbox', referencedUsers?: Array<{ __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null }> | null, notifications?: Array<{ __typename: 'DM', id: string, when: any, by: string, to: string, msgid: string, inResponseTo?: string | null, inResponseToMsg?: string | null, text: string } | { __typename: 'ForumLike', id: string, when: any, jowner: string, ymd: any, by: string, to: string, text: string } | { __typename: 'ForumNotification', id: string, when: any, jowner: string, ymd: any, by: string, to: string, text: string } | { __typename: 'JComment', id: string, when: any, jowner: string, ymd: any, by: string, to: string, msgid: string, inResponseTo?: string | null, inResponseToMsg?: string | null, text: string } | { __typename: 'LikeOnDM', id: string, when: any, by: string, to: string, msgid: string, text: string } | { __typename: 'LikeOnJComment', id: string, when: any, jowner: string, ymd: any, by: string, to: string, msgid: string, text: string } | { __typename: 'LikeOnLog', id: string, when: any, jowner: string, ymd: any, by: string } | { __typename: 'StartedFollowing', id: string, when: any, by: string, to: string } | { __typename: 'SystemNotification', id: string, when: any, text: string, variant?: SystemNotificationType | null }> | null } | null };

export type SendMessageMutationVariables = Exact<{
  message: Scalars['String'];
  type: MessageType;
  targetID: Scalars['ID'];
}>;


export type SendMessageMutation = { __typename?: 'Mutation', sendMessage?: { __typename?: 'SendMessageResult', id: string, when: any, msgid: string } | null };

export type DeleteMessageMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type DeleteMessageMutation = { __typename?: 'Mutation', deleteMessage?: boolean | null };

export type GetSessionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSessionQuery = { __typename?: 'Query', getSession?: { __typename?: 'SessionInfo', time?: string | null, user: { __typename?: 'User', id: string, avatarhash: string, uname: string, cc?: string | null, slvl?: number | null, sok?: number | null, sleft?: number | null, age?: number | null, bw?: number | null, private?: number | null, isf?: number | null, joined?: string | null, usekg?: number | null, forumRole?: string | null, custom1RM?: number | null, est1RMFactor?: number | null, jranges?: Array<number | null> | null, estimate1RMFormula?: string | null, socialLinks?: Array<string | null> | null }, forum?: { __typename?: 'ForumStatus', role?: { __typename?: 'ForumRole', id: string, title: string, can?: Array<string> | null, all?: boolean | null } | null } | null } | null };

export type SignupMutationVariables = Exact<{
  uname: Scalars['String'];
  email: Scalars['String'];
  pass: Scalars['String'];
  isf: Scalars['Int'];
  usekg: Scalars['Int'];
}>;


export type SignupMutation = { __typename?: 'Mutation', signup: boolean };

export type LoginMutationVariables = Exact<{
  u: Scalars['String'];
  p: Scalars['String'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: string };

export type VerifySignupMutationVariables = Exact<{
  code: Scalars['String'];
}>;


export type VerifySignupMutation = { __typename?: 'Mutation', verifySignup: string };

export type ForgotMutationVariables = Exact<{
  uore: Scalars['String'];
}>;


export type ForgotMutation = { __typename?: 'Mutation', forgot: boolean };

export type LoginWithGoogleMutationVariables = Exact<{
  jwt: Scalars['String'];
  uname?: InputMaybe<Scalars['String']>;
  isf?: InputMaybe<Scalars['Int']>;
  usekg?: InputMaybe<Scalars['Int']>;
}>;


export type LoginWithGoogleMutation = { __typename?: 'Mutation', loginWithGoogle: string };

export type LoginWithFirebaseMutationVariables = Exact<{
  token: Scalars['String'];
  uname?: InputMaybe<Scalars['String']>;
  isf?: InputMaybe<Scalars['Int']>;
  usekg?: InputMaybe<Scalars['Int']>;
}>;


export type LoginWithFirebaseMutation = { __typename?: 'Mutation', loginWithFirebase: string };

type SettingsFields_BlockUsersSetting_Fragment = { __typename?: 'BlockUsersSetting', id: string, waitingCodeToChange?: boolean | null };

type SettingsFields_CcSetting_Fragment = { __typename?: 'CCSetting', id: string, waitingCodeToChange?: boolean | null };

type SettingsFields_ConnectedServicesSetting_Fragment = { __typename?: 'ConnectedServicesSetting', id: string, waitingCodeToChange?: boolean | null };

type SettingsFields_Custom1RmFactorSetting_Fragment = { __typename?: 'Custom1RMFactorSetting', id: string, waitingCodeToChange?: boolean | null };

type SettingsFields_DobSetting_Fragment = { __typename?: 'DOBSetting', id: string, waitingCodeToChange?: boolean | null };

type SettingsFields_DeleteAccountSetting_Fragment = { __typename?: 'DeleteAccountSetting', id: string, waitingCodeToChange?: boolean | null };

type SettingsFields_DeveloperConfigSetting_Fragment = { __typename?: 'DeveloperConfigSetting', id: string, waitingCodeToChange?: boolean | null };

type SettingsFields_EmailSetting_Fragment = { __typename?: 'EmailSetting', id: string, waitingCodeToChange?: boolean | null };

type SettingsFields_OptionSetting_Fragment = { __typename?: 'OptionSetting', id: string, waitingCodeToChange?: boolean | null };

type SettingsFields_RpeSetting_Fragment = { __typename?: 'RPESetting', id: string, waitingCodeToChange?: boolean | null };

type SettingsFields_SocialMediasSetting_Fragment = { __typename?: 'SocialMediasSetting', id: string, waitingCodeToChange?: boolean | null };

type SettingsFields_SupporterStatus_Fragment = { __typename?: 'SupporterStatus', id: string, waitingCodeToChange?: boolean | null };

type SettingsFields_UsernameSetting_Fragment = { __typename?: 'UsernameSetting', id: string, waitingCodeToChange?: boolean | null };

type SettingsFields_VoidSetting_Fragment = { __typename?: 'VoidSetting', id: string, waitingCodeToChange?: boolean | null };

export type SettingsFieldsFragment = SettingsFields_BlockUsersSetting_Fragment | SettingsFields_CcSetting_Fragment | SettingsFields_ConnectedServicesSetting_Fragment | SettingsFields_Custom1RmFactorSetting_Fragment | SettingsFields_DobSetting_Fragment | SettingsFields_DeleteAccountSetting_Fragment | SettingsFields_DeveloperConfigSetting_Fragment | SettingsFields_EmailSetting_Fragment | SettingsFields_OptionSetting_Fragment | SettingsFields_RpeSetting_Fragment | SettingsFields_SocialMediasSetting_Fragment | SettingsFields_SupporterStatus_Fragment | SettingsFields_UsernameSetting_Fragment | SettingsFields_VoidSetting_Fragment;

type SettingFields_BlockUsersSetting_Fragment = { __typename?: 'BlockUsersSetting', unames?: Array<string | null> | null, id: string, waitingCodeToChange?: boolean | null };

type SettingFields_CcSetting_Fragment = { __typename?: 'CCSetting', cc?: string | null, id: string, waitingCodeToChange?: boolean | null, ccs?: Array<{ __typename?: 'CC', cc: string, name: string } | null> | null };

type SettingFields_ConnectedServicesSetting_Fragment = { __typename?: 'ConnectedServicesSetting', id: string, waitingCodeToChange?: boolean | null, connections?: Array<{ __typename?: 'ConnectedService', id: string, name: string, url: string }> | null };

type SettingFields_Custom1RmFactorSetting_Fragment = { __typename?: 'Custom1RMFactorSetting', factor: number, formula?: string | null, default: number, id: string, waitingCodeToChange?: boolean | null };

type SettingFields_DobSetting_Fragment = { __typename?: 'DOBSetting', dob?: any | null, id: string, waitingCodeToChange?: boolean | null };

type SettingFields_DeleteAccountSetting_Fragment = { __typename?: 'DeleteAccountSetting', signature?: string | null, id: string, waitingCodeToChange?: boolean | null };

type SettingFields_DeveloperConfigSetting_Fragment = { __typename?: 'DeveloperConfigSetting', id: string, waitingCodeToChange?: boolean | null, config: { __typename?: 'DeveloperConfig', confirmChanges?: { __typename?: 'DevConfigChanges', hash: string, changelog?: string | null } | null, services?: Array<{ __typename?: 'DeveloperService', id: string, dbid?: string | null, name: string, url: string, redirectUris: Array<string>, secret?: string | null }> | null } };

type SettingFields_EmailSetting_Fragment = { __typename?: 'EmailSetting', currentEmail: string, id: string, waitingCodeToChange?: boolean | null };

type SettingFields_OptionSetting_Fragment = { __typename?: 'OptionSetting', i?: number | null, id: string, waitingCodeToChange?: boolean | null, options?: Array<{ __typename?: 'Option', i: number, name: string } | null> | null };

type SettingFields_RpeSetting_Fragment = { __typename?: 'RPESetting', defaults?: Array<any | null> | null, overrides?: Array<any | null> | null, id: string, waitingCodeToChange?: boolean | null };

type SettingFields_SocialMediasSetting_Fragment = { __typename?: 'SocialMediasSetting', links?: Array<string | null> | null, id: string, waitingCodeToChange?: boolean | null };

type SettingFields_SupporterStatus_Fragment = { __typename?: 'SupporterStatus', slvl: number, daysLeftAsActive: number, id: string, waitingCodeToChange?: boolean | null };

type SettingFields_UsernameSetting_Fragment = { __typename?: 'UsernameSetting', uname: string, id: string, waitingCodeToChange?: boolean | null };

type SettingFields_VoidSetting_Fragment = { __typename?: 'VoidSetting', id: string, waitingCodeToChange?: boolean | null };

export type SettingFieldsFragment = SettingFields_BlockUsersSetting_Fragment | SettingFields_CcSetting_Fragment | SettingFields_ConnectedServicesSetting_Fragment | SettingFields_Custom1RmFactorSetting_Fragment | SettingFields_DobSetting_Fragment | SettingFields_DeleteAccountSetting_Fragment | SettingFields_DeveloperConfigSetting_Fragment | SettingFields_EmailSetting_Fragment | SettingFields_OptionSetting_Fragment | SettingFields_RpeSetting_Fragment | SettingFields_SocialMediasSetting_Fragment | SettingFields_SupporterStatus_Fragment | SettingFields_UsernameSetting_Fragment | SettingFields_VoidSetting_Fragment;

export type GetSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSettingsQuery = { __typename?: 'Query', getUserSettings: Array<{ __typename?: 'BlockUsersSetting', unames?: Array<string | null> | null, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'CCSetting', cc?: string | null, id: string, waitingCodeToChange?: boolean | null, ccs?: Array<{ __typename?: 'CC', cc: string, name: string } | null> | null } | { __typename?: 'ConnectedServicesSetting', id: string, waitingCodeToChange?: boolean | null, connections?: Array<{ __typename?: 'ConnectedService', id: string, name: string, url: string }> | null } | { __typename?: 'Custom1RMFactorSetting', factor: number, formula?: string | null, default: number, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'DOBSetting', dob?: any | null, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'DeleteAccountSetting', signature?: string | null, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'DeveloperConfigSetting', id: string, waitingCodeToChange?: boolean | null, config: { __typename?: 'DeveloperConfig', confirmChanges?: { __typename?: 'DevConfigChanges', hash: string, changelog?: string | null } | null, services?: Array<{ __typename?: 'DeveloperService', id: string, dbid?: string | null, name: string, url: string, redirectUris: Array<string>, secret?: string | null }> | null } } | { __typename?: 'EmailSetting', currentEmail: string, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'OptionSetting', i?: number | null, id: string, waitingCodeToChange?: boolean | null, options?: Array<{ __typename?: 'Option', i: number, name: string } | null> | null } | { __typename?: 'RPESetting', defaults?: Array<any | null> | null, overrides?: Array<any | null> | null, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'SocialMediasSetting', links?: Array<string | null> | null, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'SupporterStatus', slvl: number, daysLeftAsActive: number, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'UsernameSetting', uname: string, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'VoidSetting', id: string, waitingCodeToChange?: boolean | null } | null> };

export type SetSettingMutationVariables = Exact<{
  id: Scalars['ID'];
  value?: InputMaybe<Scalars['SettingValue']>;
}>;


export type SetSettingMutation = { __typename?: 'Mutation', setSetting?: { __typename?: 'BlockUsersSetting', unames?: Array<string | null> | null, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'CCSetting', cc?: string | null, id: string, waitingCodeToChange?: boolean | null, ccs?: Array<{ __typename?: 'CC', cc: string, name: string } | null> | null } | { __typename?: 'ConnectedServicesSetting', id: string, waitingCodeToChange?: boolean | null, connections?: Array<{ __typename?: 'ConnectedService', id: string, name: string, url: string }> | null } | { __typename?: 'Custom1RMFactorSetting', factor: number, formula?: string | null, default: number, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'DOBSetting', dob?: any | null, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'DeleteAccountSetting', signature?: string | null, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'DeveloperConfigSetting', id: string, waitingCodeToChange?: boolean | null, config: { __typename?: 'DeveloperConfig', confirmChanges?: { __typename?: 'DevConfigChanges', hash: string, changelog?: string | null } | null, services?: Array<{ __typename?: 'DeveloperService', id: string, dbid?: string | null, name: string, url: string, redirectUris: Array<string>, secret?: string | null }> | null } } | { __typename?: 'EmailSetting', currentEmail: string, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'OptionSetting', i?: number | null, id: string, waitingCodeToChange?: boolean | null, options?: Array<{ __typename?: 'Option', i: number, name: string } | null> | null } | { __typename?: 'RPESetting', defaults?: Array<any | null> | null, overrides?: Array<any | null> | null, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'SocialMediasSetting', links?: Array<string | null> | null, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'SupporterStatus', slvl: number, daysLeftAsActive: number, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'UsernameSetting', uname: string, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'VoidSetting', id: string, waitingCodeToChange?: boolean | null } | null };

export type SendVerificatonCodeMutationVariables = Exact<{
  id: Scalars['ID'];
  code: Scalars['String'];
}>;


export type SendVerificatonCodeMutation = { __typename?: 'Mutation', sendVerificationCode?: { __typename?: 'BlockUsersSetting', unames?: Array<string | null> | null, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'CCSetting', cc?: string | null, id: string, waitingCodeToChange?: boolean | null, ccs?: Array<{ __typename?: 'CC', cc: string, name: string } | null> | null } | { __typename?: 'ConnectedServicesSetting', id: string, waitingCodeToChange?: boolean | null, connections?: Array<{ __typename?: 'ConnectedService', id: string, name: string, url: string }> | null } | { __typename?: 'Custom1RMFactorSetting', factor: number, formula?: string | null, default: number, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'DOBSetting', dob?: any | null, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'DeleteAccountSetting', signature?: string | null, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'DeveloperConfigSetting', id: string, waitingCodeToChange?: boolean | null, config: { __typename?: 'DeveloperConfig', confirmChanges?: { __typename?: 'DevConfigChanges', hash: string, changelog?: string | null } | null, services?: Array<{ __typename?: 'DeveloperService', id: string, dbid?: string | null, name: string, url: string, redirectUris: Array<string>, secret?: string | null }> | null } } | { __typename?: 'EmailSetting', currentEmail: string, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'OptionSetting', i?: number | null, id: string, waitingCodeToChange?: boolean | null, options?: Array<{ __typename?: 'Option', i: number, name: string } | null> | null } | { __typename?: 'RPESetting', defaults?: Array<any | null> | null, overrides?: Array<any | null> | null, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'SocialMediasSetting', links?: Array<string | null> | null, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'SupporterStatus', slvl: number, daysLeftAsActive: number, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'UsernameSetting', uname: string, id: string, waitingCodeToChange?: boolean | null } | { __typename?: 'VoidSetting', id: string, waitingCodeToChange?: boolean | null } | null };

export type UnsubFromEmailsMutationVariables = Exact<{
  token?: InputMaybe<Scalars['String']>;
}>;


export type UnsubFromEmailsMutation = { __typename?: 'Mutation', unsubFromEmails?: boolean | null };

export type GetSupportersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSupportersQuery = { __typename?: 'Query', getSupporters?: Array<{ __typename?: 'Supporter', when?: string | null, user: { __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null } } | null> | null };

export type GetActiveSupportersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActiveSupportersQuery = { __typename?: 'Query', getActiveSupporters?: Array<{ __typename?: 'Supporter', when?: string | null, user: { __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null } } | null> | null };

export type GetTwitterChallengesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTwitterChallengesQuery = { __typename?: 'Query', getTwitterChallenges?: Array<{ __typename?: 'TweetChallenge', description: string, title: string, type: TweetType } | null> | null };

export type GetTwitterChallengesStatusesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTwitterChallengesStatusesQuery = { __typename?: 'Query', getTwitterChallengesStates?: Array<{ __typename?: 'TweetState', fecha: any, granted?: boolean | null, status?: string | null, tweet: string, type: TweetType } | null> | null };

export type SetTweetMutationVariables = Exact<{
  tweetID?: InputMaybe<Scalars['ID']>;
  type?: InputMaybe<TweetType>;
}>;


export type SetTweetMutation = { __typename?: 'Mutation', setTweet?: boolean | null };

export type DeleteTweetMutationVariables = Exact<{
  tweetID?: InputMaybe<Scalars['ID']>;
}>;


export type DeleteTweetMutation = { __typename?: 'Mutation', deleteTweet?: boolean | null };

export type UserFieldsFragment = { __typename?: 'User', id: string, avatarhash: string, uname: string, cc?: string | null, slvl?: number | null, sok?: number | null, sleft?: number | null, age?: number | null, bw?: number | null, private?: number | null, isf?: number | null, joined?: string | null, usekg?: number | null, forumRole?: string | null, custom1RM?: number | null, est1RMFactor?: number | null, jranges?: Array<number | null> | null, estimate1RMFormula?: string | null, socialLinks?: Array<string | null> | null };

export type BriefUserFieldsFragment = { __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null };

export type UploadAvatarMutationVariables = Exact<{
  file: Scalars['Upload'];
}>;


export type UploadAvatarMutation = { __typename?: 'Mutation', uploadAvatar: string };

export type DeleteAvatarMutationVariables = Exact<{ [key: string]: never; }>;


export type DeleteAvatarMutation = { __typename?: 'Mutation', deleteAvatar?: boolean | null };

export type GetVideosQueryVariables = Exact<{
  olderThan?: InputMaybe<Scalars['UTCDate']>;
  limit?: InputMaybe<Scalars['Int']>;
}>;


export type GetVideosQuery = { __typename?: 'Query', getVideos?: Array<{ __typename?: 'Video', when: string, posted: string, logid: string, link: string, user: { __typename?: 'User', id: string, avatarhash: string, joined?: string | null, private?: number | null, uname: string, cc?: string | null, isf?: number | null, sok?: number | null, slvl?: number | null, forumRole?: string | null } } | null> | null };
