CREATE TABLE `researchers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`affiliation` text DEFAULT '' NOT NULL,
	`profile_url` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`kind` text DEFAULT 'researcher' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
