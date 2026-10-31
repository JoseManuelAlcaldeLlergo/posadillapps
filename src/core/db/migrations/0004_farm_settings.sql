CREATE TABLE `farm_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`farm_code` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	CONSTRAINT "farm_settings_single_row" CHECK("farm_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE `farm_productive_units` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `farm_productive_units_name_key_unique` ON `farm_productive_units` (`name_key`);