 
CREATE TABLE IF NOT EXISTS `oauth_clients` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `uid` INTEGER UNSIGNED NOT NULL,
    `client_id` VARCHAR(80) UNIQUE NOT NULL,
    `app_name` VARCHAR(80) NOT NULL,
    `app_url` VARCHAR(2048) NOT NULL,
    `client_secret` VARCHAR(255),
    `redirect_uri` TEXT NOT NULL,

    FOREIGN KEY (`uid`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `dev_app`(`uid`,`client_id` )
);

CREATE TABLE IF NOT EXISTS `oauth_authorization_token` (
    `token` VARCHAR(255) PRIMARY KEY,
    `redirect_uri` VARCHAR(2048) NOT NULL,
    `expires_at` TIMESTAMP NOT NULL, 
    `client_id` VARCHAR(255),
    `user_id` INTEGER UNSIGNED NOT NULL,
    `code_challenge` VARCHAR(64) NOT NULL,
    `code_challenge_method` VARCHAR(10) NOT NULL,
    `scope` TEXT,  -- Storing the scope associated with the token 

    FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`client_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ,
    INDEX `connected_service`(`user_id`,`client_id` )
);

CREATE TABLE IF NOT EXISTS `oauth_access_tokens` (
    `refresh_token` VARCHAR(64) NOT NULL PRIMARY KEY,
    `refresh_expires_at` TIMESTAMP NOT NULL, 
    `access_token` VARCHAR(64) NOT NULL,
    `access_expires_at` TIMESTAMP NOT NULL,  
    `client_id` VARCHAR(255),
    `user_id` INTEGER UNSIGNED NOT NULL,
    `scope` TEXT, -- Storing the scope associated with the token
    
    INDEX `access_token` (`access_token`),
    FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`client_id`)  ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ,
    INDEX `connected_service`(`user_id`,`client_id` )
);