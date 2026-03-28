CREATE TABLE `feed` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`category` text,
	`last_fetched` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`keywords` text
);
--> statement-breakpoint
CREATE TABLE `feed_item` (
	`id` text PRIMARY KEY NOT NULL,
	`feed_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`published_at` text,
	`summary` text,
	`is_saved` integer DEFAULT 0 NOT NULL,
	`is_dismissed` integer DEFAULT 0 NOT NULL,
	`discovered_at` text NOT NULL,
	FOREIGN KEY (`feed_id`) REFERENCES `feed`(`id`) ON UPDATE no action ON DELETE cascade
);
