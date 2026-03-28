CREATE TABLE `author` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `author_name_unique` ON `author` (`name`);--> statement-breakpoint
CREATE TABLE `resource` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`url` text,
	`description` text,
	`status` text DEFAULT 'backlog' NOT NULL,
	`rating` integer,
	`priority` text DEFAULT 'medium' NOT NULL,
	`difficulty` text,
	`cover_image_url` text,
	`source_feed_id` text,
	`personal_notes` text,
	`date_added` text NOT NULL,
	`date_started` text,
	`date_completed` text
);
--> statement-breakpoint
CREATE TABLE `resource_author` (
	`resource_id` text NOT NULL,
	`author_id` text NOT NULL,
	PRIMARY KEY(`resource_id`, `author_id`),
	FOREIGN KEY (`resource_id`) REFERENCES `resource`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `author`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `resource_tag` (
	`resource_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`resource_id`, `tag_id`),
	FOREIGN KEY (`resource_id`) REFERENCES `resource`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_name_unique` ON `tag` (`name`);