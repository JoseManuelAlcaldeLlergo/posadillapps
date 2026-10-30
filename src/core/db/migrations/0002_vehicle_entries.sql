CREATE TABLE `vehicle_regulars` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plate` text NOT NULL,
	`plate_key` text NOT NULL,
	`frequency` text NOT NULL,
	`reason` text NOT NULL,
	`vehicle_type` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `vehicle_regulars_plate_key_idx` ON `vehicle_regulars` (`plate_key`);--> statement-breakpoint
CREATE TABLE `vehicle_visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`plate` text NOT NULL,
	`plate_key` text NOT NULL,
	`reason` text NOT NULL,
	`vehicle_type` text NOT NULL,
	`source` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `vehicle_visits_date_idx` ON `vehicle_visits` (`date`);--> statement-breakpoint
CREATE INDEX `vehicle_visits_plate_key_idx` ON `vehicle_visits` (`plate_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_visits_automatic_unique` ON `vehicle_visits` (`source`,`date`,`plate_key`) WHERE "vehicle_visits"."source" is not null;