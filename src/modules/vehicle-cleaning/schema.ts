import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

/**
 * Vehicles cleaned with a fixed frequency, with the values used when a year
 * is generated. Inactive ones are kept but not generated.
 */
export const cleaningVehicles = sqliteTable(
  'vehicle_cleaning_vehicles',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** Plate or chassis number, normalized with `normalizePlate`. */
    plate: text('plate').notNull(),
    /** `plateKey(plate)`: one vehicle per plate. */
    plateKey: text('plate_key').notNull(),
    frequency: text('frequency').notNull(),
    productName: text('product_name').notNull(),
    vehicleType: text('vehicle_type').notNull(),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [uniqueIndex('vehicle_cleaning_vehicles_plate_key_unique').on(table.plateKey)],
);

/**
 * Periodic cleaning of a vehicle during a year (one row per vehicle and year).
 * Texts are snapshots; `vehicleId` becomes null if the vehicle is deleted.
 */
export const periodicCleanings = sqliteTable(
  'vehicle_cleaning_periodic',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    year: integer('year').notNull(),
    vehicleId: integer('vehicle_id').references(() => cleaningVehicles.id, { onDelete: 'set null' }),
    plate: text('plate').notNull(),
    plateKey: text('plate_key').notNull(),
    frequency: text('frequency').notNull(),
    productName: text('product_name').notNull(),
    vehicleType: text('vehicle_type').notNull(),
    /** Free text, e.g. `Semanalmente 2023`; null is exported as `—`. */
    reviewText: text('review_text'),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [
    index('vehicle_cleaning_periodic_year_idx').on(table.year),
    index('vehicle_cleaning_periodic_plate_key_idx').on(table.plateKey),
  ],
);

/** One cleaning of a vehicle on a given date. */
export const oneOffCleanings = sqliteTable(
  'vehicle_cleaning_one_offs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** ISO `YYYY-MM-DD` */
    date: text('date').notNull(),
    plate: text('plate').notNull(),
    plateKey: text('plate_key').notNull(),
    productName: text('product_name').notNull(),
    vehicleType: text('vehicle_type').notNull(),
    reviewText: text('review_text'),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [
    index('vehicle_cleaning_one_offs_date_idx').on(table.date),
    index('vehicle_cleaning_one_offs_plate_key_idx').on(table.plateKey),
  ],
);

export type CleaningVehicle = typeof cleaningVehicles.$inferSelect;
export type PeriodicCleaning = typeof periodicCleanings.$inferSelect;
export type OneOffCleaning = typeof oneOffCleanings.$inferSelect;
