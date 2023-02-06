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

    INDEX `eid`(`eid`),
    INDEX `logid`(`logid`, `uid`),
    INDEX `uid`(`uid`),
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

    INDEX `isDeleted`(`deleted`),
    INDEX `last_log`(`last_log`),
    INDEX `supporterLevel`(`supporterLevel`),
    INDEX `uname`(`uname`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `users_forgot` (
    `code` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `uid` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;



TRUNCATE TABLE `rpe`;

-- RPEs table data
INSERT INTO `rpe` (`id`, `rep`, `rpe`, `percent`) VALUES
(1, 1, 6, 0.863),
(2, 1, 7, 0.892),
(3, 1, 8, 0.929),
(4, 1, 9, 0.955),
(5, 1, 10, 1),
(6, 1, 9.5, 0.978),
(7, 1, 8.5, 0.939),
(8, 1, 7.5, 0.907),
(9, 1, 6.5, 0.878),
(10, 2, 6, 0.837),
(11, 2, 7, 0.863),
(12, 2, 8, 0.892),
(13, 2, 9, 0.922),
(14, 2, 10, 0.955),
(15, 2, 9.5, 0.939),
(16, 2, 8.5, 0.907),
(17, 2, 7.5, 0.878),
(18, 2, 6.5, 0.85),
(19, 3, 6, 0.811),
(20, 3, 7, 0.837),
(21, 3, 8, 0.863),
(22, 3, 9, 0.892),
(23, 3, 10, 0.922),
(24, 3, 9.5, 0.907),
(25, 3, 8.5, 0.878),
(26, 3, 7.5, 0.85),
(27, 3, 6.5, 0.824),
(28, 4, 6, 0.786),
(29, 4, 7, 0.811),
(30, 4, 8, 0.837),
(31, 4, 9, 0.863),
(32, 4, 10, 0.892),
(33, 4, 9.5, 0.878),
(34, 4, 8.5, 0.85),
(35, 4, 7.5, 0.824),
(36, 4, 6.5, 0.799),
(37, 5, 6, 0.762),
(38, 5, 7, 0.786),
(39, 5, 8, 0.811),
(40, 5, 9, 0.837),
(41, 5, 10, 0.863),
(42, 5, 9.5, 0.85),
(43, 5, 8.5, 0.824),
(44, 5, 7.5, 0.799),
(45, 5, 6.5, 0.774),
(46, 6, 6, 0.739),
(47, 6, 7, 0.762),
(48, 6, 8, 0.786),
(49, 6, 9, 0.811),
(50, 6, 10, 0.837),
(51, 6, 9.5, 0.824),
(52, 6, 8.5, 0.799),
(53, 6, 7.5, 0.774),
(54, 6, 6.5, 0.751),
(55, 7, 6, 0.707),
(56, 7, 7, 0.739),
(57, 7, 8, 0.762),
(58, 7, 9, 0.786),
(59, 7, 10, 0.811),
(60, 7, 9.5, 0.799),
(61, 7, 8.5, 0.774),
(62, 7, 7.5, 0.751),
(63, 7, 6.5, 0.723),
(64, 8, 6, 0.68),
(65, 8, 7, 0.707),
(66, 8, 8, 0.739),
(67, 8, 9, 0.762),
(68, 8, 10, 0.786),
(69, 8, 9.5, 0.774),
(70, 8, 8.5, 0.751),
(71, 8, 7.5, 0.723),
(72, 8, 6.5, 0.694),
(73, 9, 6, 0.653),
(74, 9, 7, 0.68),
(75, 9, 8, 0.707),
(76, 9, 9, 0.739),
(77, 9, 10, 0.762),
(78, 9, 9.5, 0.751),
(79, 9, 8.5, 0.723),
(80, 9, 7.5, 0.694),
(81, 9, 6.5, 0.667),
(82, 10, 6, 0.626),
(83, 10, 7, 0.653),
(84, 10, 8, 0.68),
(85, 10, 9, 0.707),
(86, 10, 10, 0.739),
(87, 10, 9.5, 0.723),
(88, 10, 8.5, 0.694),
(89, 10, 7.5, 0.667),
(90, 10, 6.5, 0.64),
(91, 11, 6, 0.599),
(92, 11, 7, 0.626),
(93, 11, 8, 0.653),
(94, 11, 9, 0.68),
(95, 11, 10, 0.707),
(96, 11, 9.5, 0.694),
(97, 11, 8.5, 0.667),
(98, 11, 7.5, 0.64),
(99, 11, 6.5, 0.613),
(100, 12, 6, 0.574),
(101, 12, 7, 0.599),
(102, 12, 8, 0.626),
(103, 12, 9, 0.653),
(104, 12, 10, 0.68),
(105, 12, 9.5, 0.667),
(106, 12, 8.5, 0.64),
(107, 12, 7.5, 0.613),
(108, 12, 6.5, 0.586);
 