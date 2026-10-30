import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { VEHICLE_TYPES } from './vehicleTypes';

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

/**
 * Vehicles that come in with a fixed frequency and are not written down each
 * time. Inactive ones are kept but no longer exported.
 */
export const vehicleRegulars = sqliteTable(
  'vehicle_regulars',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** As typed, normalized with `normalizePlate`. */
    plate: text('plate').notNull(),
    /** `plateKey(plate)`, for search and comparison. */
    plateKey: text('plate_key').notNull(),
    frequency: text('frequency').notNull(),
    reason: text('reason').notNull(),
    vehicleType: text('vehicle_type', { enum: VEHICLE_TYPES }).notNull(),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [index('vehicle_regulars_plate_key_idx').on(table.plateKey)],
);

/**
 * One vehicle entry on a given date. `source` is null for visits typed by
 * hand and names the module that created it for automatic ones; there is at
 * most one automatic visit per source, date and plate.
 */
export const vehicleVisits = sqliteTable(
  'vehicle_visits',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** ISO `YYYY-MM-DD` */
    date: text('date').notNull(),
    plate: text('plate').notNull(),
    plateKey: text('plate_key').notNull(),
    reason: text('reason').notNull(),
    vehicleType: text('vehicle_type', { enum: VEHICLE_TYPES }).notNull(),
    source: text('source'),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [
    index('vehicle_visits_date_idx').on(table.date),
    index('vehicle_visits_plate_key_idx').on(table.plateKey),
    uniqueIndex('vehicle_visits_automatic_unique')
      .on(table.source, table.date, table.plateKey)
      .where(sql`${table.source} is not null`),
  ],
);

export type VehicleRegular = typeof vehicleRegulars.$inferSelect;
export type VehicleVisit = typeof vehicleVisits.$inferSelect;
