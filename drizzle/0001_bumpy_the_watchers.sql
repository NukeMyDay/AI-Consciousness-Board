CREATE TABLE `highlight` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_id` text NOT NULL,
	`text` text NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resource`(`id`) ON UPDATE no action ON DELETE cascade
);
