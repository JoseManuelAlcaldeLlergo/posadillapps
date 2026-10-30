CREATE TABLE `feed_supplier_trucks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supplier_id` integer NOT NULL,
	`plate` text NOT NULL,
	`plate_key` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `feed_suppliers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feed_supplier_trucks_supplier_plate_key_unique` ON `feed_supplier_trucks` (`supplier_id`,`plate_key`);--> statement-breakpoint
ALTER TABLE `feed_entries` ADD `truck_plate` text;--> statement-breakpoint
ALTER TABLE `feed_entries` ADD `truck_id` integer REFERENCES feed_supplier_trucks(id) ON DELETE set null;--> statement-breakpoint
ALTER TABLE `feed_entries` ADD `vehicle_visit_id` integer REFERENCES vehicle_visits(id) ON DELETE set null;--> statement-breakpoint
CREATE INDEX `feed_entries_vehicle_visit_idx` ON `feed_entries` (`vehicle_visit_id`);