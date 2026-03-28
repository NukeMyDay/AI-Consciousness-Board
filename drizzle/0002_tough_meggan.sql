CREATE TABLE `learning_path` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learning_path_step` (
	`id` text PRIMARY KEY NOT NULL,
	`path_id` text NOT NULL,
	`position` integer NOT NULL,
	`resource_id` text,
	`title` text NOT NULL,
	`description` text,
	`is_completed` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`path_id`) REFERENCES `learning_path`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resource_id`) REFERENCES `resource`(`id`) ON UPDATE no action ON DELETE set null
);
