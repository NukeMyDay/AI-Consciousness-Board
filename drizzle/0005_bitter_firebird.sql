CREATE TABLE `card_review` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`scheduled_at` text NOT NULL,
	`completed_at` text,
	`rating` text,
	`interval_days` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `knowledge_card`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `knowledge_card` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_id` text,
	`concept` text NOT NULL,
	`explanation` text,
	`difficulty` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resource`(`id`) ON UPDATE no action ON DELETE set null
);
