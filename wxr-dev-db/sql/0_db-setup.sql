-- CreateTable
CREATE TABLE IF NOT EXISTS `code_verification` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(6) NOT NULL,
    `param` VARCHAR(80) NOT NULL,
    `setting_key` VARCHAR(10) NOT NULL,
    `uid` INTEGER UNSIGNED NOT NULL,

    INDEX `identificador`(`uid`, `setting_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `donations_history` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `uid` INTEGER UNSIGNED NOT NULL,
    `donation` DECIMAL(6, 2) NOT NULL,
    `fecha` DATE NOT NULL,

    INDEX `uid`(`uid`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `email_send_queue` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `touid` INTEGER UNSIGNED NOT NULL,
    `subject` VARCHAR(80) NOT NULL,
    `message` TEXT NOT NULL,

    INDEX `touid`(`touid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `erows` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `logid` INTEGER UNSIGNED NOT NULL,
    `uid` INTEGER UNSIGNED NOT NULL,
    `eid` INTEGER UNSIGNED NOT NULL,
    `block` INTEGER UNSIGNED NOT NULL,
    `usedBW` BOOLEAN NOT NULL,
    `added2BW` FLOAT NOT NULL,
    `wkg` FLOAT NOT NULL,
    `inlbs` BOOLEAN NOT NULL,
    `reps` INTEGER UNSIGNED NOT NULL,
    `sets` INTEGER UNSIGNED NOT NULL,
    `comment` VARCHAR(255) NOT NULL,
    `rpe` FLOAT NOT NULL,

    `distance` int UNSIGNED DEFAULT '0',
    `distance_unit` enum('cm','m','km','in','ft','yd','mi') DEFAULT NULL,
    `duration` mediumint UNSIGNED DEFAULT '0',
    `type` tinyint UNSIGNED DEFAULT '0',

    INDEX `eid`(`eid`),
    INDEX `logid`(`logid`, `uid`),
    INDEX `uid`(`uid`),

    INDEX `idx_erows_uid_eid_logid` (`uid`, `eid`, `logid`), 
    INDEX `idx_erows_wkg`(`wkg`), 
    INDEX `idx_erows_reps` (`reps`), 
    INDEX `idx_erows_wkg_reps` (`wkg`, `reps`), 
    INDEX `idx_erows_just_logid` (`logid`),
    INDEX `idx_erows_eid_wkg` (`eid`, `wkg`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `event_notification` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `uid` INTEGER UNSIGNED NOT NULL,
    `bday` INTEGER NOT NULL,
    `jday` INTEGER NOT NULL,

    UNIQUE INDEX `uid`(`uid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `exercises` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `uid` INTEGER UNSIGNED NOT NULL,
    `nombre` VARCHAR(80) NOT NULL,
    `days` INTEGER UNSIGNED NOT NULL,
    `reps` INTEGER UNSIGNED NOT NULL,

    INDEX `uid`(`uid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `exercises` ADD FULLTEXT KEY `nameIndex` (`nombre`);

-- CreateTable
CREATE TABLE IF NOT EXISTS `follow` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `followerid` INTEGER UNSIGNED NOT NULL,
    `followingid` INTEGER UNSIGNED NOT NULL,

    INDEX `followerid`(`followerid`, `followingid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `likes_counter` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `type_id` INTEGER UNSIGNED NOT NULL,
    `source_id` INTEGER UNSIGNED NOT NULL,
    `counter` INTEGER UNSIGNED NOT NULL,

    UNIQUE INDEX `like-key`(`type_id`, `source_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `likes_history` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `uid` INTEGER UNSIGNED NOT NULL,
    `type_id` INTEGER UNSIGNED NOT NULL,
    `source_id` INTEGER UNSIGNED NOT NULL,
    `fecha` DATETIME(0) NOT NULL,

    INDEX `uid`(`uid`, `type_id`, `source_id`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `logs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `uid` INTEGER UNSIGNED NOT NULL,
    `ultima_modificacion` DATETIME(0) NOT NULL,
    `fecha_del_log` DATE NOT NULL,
    `bw` FLOAT NOT NULL,
    `log` TEXT NOT NULL,
    `fromMobile` BOOLEAN NOT NULL,

    INDEX `fecha_del_log`(`fecha_del_log`),
    INDEX `fromMobile`(`fromMobile`),
    INDEX `uid`(`uid`, `ultima_modificacion`),

    INDEX `idx_logs_uid_fecha_del_log` (`uid`, `fecha_del_log`),
    INDEX `idx_logs_justuid` (`uid`),
    INDEX `idx_logs_justbw` (`bw`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `message_to` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `msgid` INTEGER UNSIGNED NOT NULL,
    `touid` INTEGER UNSIGNED NOT NULL,
    `leido` BOOLEAN NOT NULL,

    INDEX `msgid`(`msgid`, `touid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `messages` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `topic` INTEGER UNSIGNED NOT NULL,
    `isGlobal` BOOLEAN NOT NULL,
    `uid` INTEGER UNSIGNED NOT NULL,
    `subject` VARCHAR(100) NOT NULL,
    `message` TEXT NOT NULL,
    `fecha` DATETIME(0) NOT NULL,
    `parentid` INTEGER UNSIGNED NOT NULL,
    `logid` INTEGER UNSIGNED NOT NULL,

    INDEX `topic_index`(`topic`),
    INDEX `uid`(`uid`, `parentid`, `logid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `rpe` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `rep` INTEGER UNSIGNED NOT NULL,
    `rpe` FLOAT NOT NULL,
    `percent` FLOAT NOT NULL,

    INDEX `rep_rpe`(`rep`, `rpe`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `rpe_override` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `uid` INTEGER UNSIGNED NOT NULL,
    `rep` INTEGER UNSIGNED NOT NULL,
    `rpe` FLOAT NOT NULL,
    `percent` FLOAT NOT NULL,

    INDEX `rep_rpe`(`rep`, `rpe`),
    INDEX `uid`(`uid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `signup_users` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `uname` VARCHAR(80) NOT NULL,
    `pass` VARCHAR(32) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `isFemale` BOOLEAN NOT NULL,
    `usekg` BOOLEAN NOT NULL,
    `fecha` DATETIME(0) NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `agent_id` VARCHAR(32) NOT NULL,

    INDEX `agentid`(`agent_id`),
    INDEX `codigo`(`code`),
    INDEX `username`(`uname`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `social-links` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `uid` INTEGER UNSIGNED NOT NULL,
    `url` VARCHAR(100) NOT NULL,

    INDEX `uid`(`uid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `users` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `deleted` BOOLEAN NOT NULL,
    `email` VARCHAR(100) NOT NULL, 
    `uname` VARCHAR(80) NOT NULL,
    `supporterLevel` FLOAT NOT NULL,
    `days_left_as_supporter` INTEGER NOT NULL,
    `isFemale` BOOLEAN NOT NULL,
    `joined` DATE NOT NULL,
    `rank` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `pass` VARCHAR(32) NOT NULL,
    `phoneHASH` VARCHAR(32) NULL,
    `bday` DATE NULL,
    `country_code` VARCHAR(10) NULL,
    `usekg` BOOLEAN NOT NULL DEFAULT false,
    `bw` FLOAT NOT NULL DEFAULT 0,
    `hidebw` BOOLEAN NOT NULL,
    `last_log` DATETIME(0) NULL,
    `idOfLastLog` INTEGER UNSIGNED NULL,
    `private` BOOLEAN NOT NULL,
    `custom1RM` INTEGER UNSIGNED NOT NULL,
    `availableDownloads` INTEGER NOT NULL,
    `blockedusers` VARCHAR(500) NOT NULL,
    `forumRole` tinyint DEFAULT NULL,

    INDEX `isDeleted`(`deleted`),
    INDEX `phoneHASH`(`phoneHASH`),
    INDEX `last_log`(`last_log`),
    INDEX `supporterLevel`(`supporterLevel`),
    INDEX `uname`(`uname`), 
    INDEX `idx_users_private_and_deleted` (`private`, `deleted`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `users_forgot` (
    `code` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `uid` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS twitter_ids (
  id BIGINT NOT NULL,
  `uid` INTEGER UNSIGNED NOT NULL,
  `type` VARCHAR(30) NOT NULL,
  `fecha` DATE NOT NULL,
  `granted` BOOLEAN NOT NULL,

  PRIMARY KEY (id),
  UNIQUE (id),
  INDEX `uid_type`(`uid`,`type`),
  INDEX `uid`(`uid`)
);

CREATE TABLE IF NOT EXISTS `users_notifications_settings` (
  `uid` int UNSIGNED NOT NULL,
  `email` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (uid),
  UNIQUE (uid) 
);


CREATE TABLE IF NOT EXISTS `tags` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid` INTEGER UNSIGNED NOT NULL, 
  `name` VARCHAR(30) NOT NULL,

  PRIMARY KEY (id),
  INDEX tags_of (uid) 
);

CREATE TABLE IF NOT EXISTS `tags_used` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid` INTEGER UNSIGNED NOT NULL,
  `logid` INTEGER UNSIGNED NOT NULL,
  `tagid` INTEGER UNSIGNED NOT NULL,
  `type` VARCHAR(12) NOT NULL,
  `value` VARCHAR(12) NOT NULL,

  PRIMARY KEY (id),
  INDEX tags_used_in (uid, logid) ,
  INDEX tag_locator (tagid),
  INDEX tag_type (`type`)
);

--
-- Estructura de tabla para la tabla `forum`
--

CREATE TABLE IF NOT EXISTS `forum` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT ,
  `uid` int UNSIGNED NOT NULL,
  `section_id` int UNSIGNED NOT NULL,
  `thread_id` int UNSIGNED NOT NULL,
  `parent_id` int UNSIGNED NOT NULL,
  `parents_ids` varchar(8000) COLLATE utf8mb4_unicode_ci DEFAULT ' ',
  `post_preview` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'colamente si es necesario, else, se usa el post comment entero.',
  `post_comment` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `replies_count` int UNSIGNED NOT NULL,
  `post_views` int UNSIGNED NOT NULL,
  `fecha_de_publicacion` datetime NOT NULL,

   PRIMARY KEY (`id` ),
   INDEX `uid` (`uid`,`section_id`,`thread_id`,`parent_id`,`fecha_de_publicacion`)
);




CREATE TABLE IF NOT EXISTS `goals` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL,
  `uid` INT UNSIGNED NOT NULL,
  `eid` INTEGER UNSIGNED NOT NULL,
  `creationDate` DATE NOT NULL,
  `maxDate` DATE NOT NULL,
  `completionDate` DATE DEFAULT NULL COMMENT 'The date in which this goal was completed',
  `plannedProgress` TEXT COMMENT 'JSON array of numbers from 0-1. Each element is a day...',
  
  `type` TINYINT UNSIGNED DEFAULT 0,
  `weight` DECIMAL(6, 2) DEFAULT 1,
  `distance` int UNSIGNED DEFAULT 0, 
  `time` mediumint UNSIGNED DEFAULT 0,
  `sets` INT UNSIGNED DEFAULT 1,
  `reps` INT UNSIGNED DEFAULT 0,
  
  `comment` VARCHAR(300) COLLATE utf8mb4_unicode_ci ,

  `dUnit` ENUM('cm','m','km','in','ft','yd','mi') DEFAULT NULL COMMENT 'Weight unit of the distance used by the user...',
  `tGoalFaster` TINYINT(1) NOT NULL DEFAULT 0 COMMENT "If true, it means less time is better than more time...",

  PRIMARY KEY (`id`),
  INDEX `byUser` (`uid`),
  INDEX `byUserAndType` (`uid`, `type`),
  
  -- Composite index to optimize queries between creationDate and maxDate
  INDEX `byDateRange` (`creationDate`, `maxDate`),

  -- Index to optimize queries filtering on completionDate IS NULL (incomplete goals)
  INDEX `byCompletionDate` (`completionDate`),
  FOREIGN KEY (`uid`) REFERENCES users(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`eid`) REFERENCES exercises(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `ai_reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `logid` int(11) NOT NULL,
  `log_version` datetime NOT NULL,
  `comment` text NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),

  PRIMARY KEY (`id`),
  UNIQUE KEY `logid` (`logid`)
);
