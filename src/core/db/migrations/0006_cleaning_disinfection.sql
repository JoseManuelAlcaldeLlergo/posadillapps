CREATE TABLE `cleaning_applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`farm_code` text NOT NULL,
	`productive_unit` text NOT NULL,
	`product_name` text NOT NULL,
	`product_key` text NOT NULL,
	`product_id` integer,
	`place` text NOT NULL,
	`waiting_days` integer NOT NULL,
	`review_date` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `cleaning_products`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "cleaning_applications_waiting_days_non_negative" CHECK("cleaning_applications"."waiting_days" >= 0)
);
--> statement-breakpoint
CREATE INDEX `cleaning_applications_date_idx` ON `cleaning_applications` (`date`);--> statement-breakpoint
CREATE INDEX `cleaning_applications_product_key_idx` ON `cleaning_applications` (`product_key`);--> statement-breakpoint
CREATE TABLE `cleaning_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`default_waiting_days` integer DEFAULT 0 NOT NULL,
	`default_place` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	CONSTRAINT "cleaning_products_waiting_days_non_negative" CHECK("cleaning_products"."default_waiting_days" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cleaning_products_name_key_unique` ON `cleaning_products` (`name_key`);--> statement-breakpoint
CREATE TABLE `cleaning_regulars` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`farm_code` text NOT NULL,
	`productive_unit` text NOT NULL,
	`frequency` text NOT NULL,
	`product_name` text NOT NULL,
	`product_key` text NOT NULL,
	`product_id` integer,
	`place` text NOT NULL,
	`waiting_days` integer NOT NULL,
	`review_date` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `cleaning_products`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "cleaning_regulars_waiting_days_non_negative" CHECK("cleaning_regulars"."waiting_days" >= 0)
);
--> statement-breakpoint
CREATE INDEX `cleaning_regulars_product_key_idx` ON `cleaning_regulars` (`product_key`);