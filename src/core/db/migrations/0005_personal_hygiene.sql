CREATE TABLE `hygiene_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`farm_code` text NOT NULL,
	`productive_unit` text NOT NULL,
	`action` text NOT NULL,
	`place` text NOT NULL,
	`result` text NOT NULL,
	`corrective_measures` text,
	`date_text` text NOT NULL,
	`template_id` integer,
	`position` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `hygiene_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `hygiene_records_year_idx` ON `hygiene_records` (`year`);--> statement-breakpoint
CREATE INDEX `hygiene_records_year_template_idx` ON `hygiene_records` (`year`,`template_id`);--> statement-breakpoint
CREATE TABLE `hygiene_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`productive_unit` text NOT NULL,
	`place` text NOT NULL,
	`result` text NOT NULL,
	`corrective_measures` text,
	`date_text` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
