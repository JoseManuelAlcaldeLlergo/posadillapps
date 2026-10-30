CREATE TABLE `feed_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`quantity` real NOT NULL,
	`unit` text DEFAULT 'kg' NOT NULL,
	`supplier_name` text NOT NULL,
	`supplier_id` integer,
	`feed_name` text NOT NULL,
	`feed_id` integer,
	`invoice` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `feed_suppliers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`feed_id`) REFERENCES `feed_supplier_feeds`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "feed_entries_quantity_positive" CHECK("feed_entries"."quantity" > 0)
);
--> statement-breakpoint
CREATE INDEX `feed_entries_date_idx` ON `feed_entries` (`date`);--> statement-breakpoint
CREATE INDEX `feed_entries_supplier_name_idx` ON `feed_entries` (`supplier_name`);--> statement-breakpoint
CREATE TABLE `feed_supplier_feeds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supplier_id` integer NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `feed_suppliers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feed_supplier_feeds_supplier_name_key_unique` ON `feed_supplier_feeds` (`supplier_id`,`name_key`);--> statement-breakpoint
CREATE TABLE `feed_suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feed_suppliers_name_key_unique` ON `feed_suppliers` (`name_key`);