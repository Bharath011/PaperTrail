ALTER TABLE `papers` ADD `venue` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `papers` ADD `status` text DEFAULT 'to-read' NOT NULL;
--> statement-breakpoint
ALTER TABLE `papers` ADD `key_takeaways` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `papers` ADD `limitations` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `papers` ADD `connections` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `papers` ADD `tags` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `papers` ADD `completed_at` text;
--> statement-breakpoint
UPDATE `papers` SET `status` = CASE WHEN `is_read` = 1 THEN 'completed' ELSE 'to-read' END;
