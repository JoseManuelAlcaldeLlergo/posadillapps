CREATE TABLE `vehicle_cleaning_vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plate` text NOT NULL,
	`plate_key` text NOT NULL,
	`frequency` text NOT NULL,
	`product_name` text NOT NULL,
	`vehicle_type` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_cleaning_vehicles_plate_key_unique` ON `vehicle_cleaning_vehicles` (`plate_key`);--> statement-breakpoint
CREATE TABLE `vehicle_cleaning_one_offs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`plate` text NOT NULL,
	`plate_key` text NOT NULL,
	`product_name` text NOT NULL,
	`vehicle_type` text NOT NULL,
	`review_text` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `vehicle_cleaning_one_offs_date_idx` ON `vehicle_cleaning_one_offs` (`date`);--> statement-breakpoint
CREATE INDEX `vehicle_cleaning_one_offs_plate_key_idx` ON `vehicle_cleaning_one_offs` (`plate_key`);--> statement-breakpoint
CREATE TABLE `vehicle_cleaning_periodic` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`vehicle_id` integer,
	`plate` text NOT NULL,
	`plate_key` text NOT NULL,
	`frequency` text NOT NULL,
	`product_name` text NOT NULL,
	`vehicle_type` text NOT NULL,
	`review_text` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle_cleaning_vehicles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `vehicle_cleaning_periodic_year_idx` ON `vehicle_cleaning_periodic` (`year`);--> statement-breakpoint
CREATE INDEX `vehicle_cleaning_periodic_plate_key_idx` ON `vehicle_cleaning_periodic` (`plate_key`);