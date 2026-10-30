import { sql } from 'drizzle-orm';
import { check, index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { vehicleVisits } from '../vehicle-entries';
import { FEED_UNITS } from './units';

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

/** Favorite suppliers. `nameKey` (see `names.ts`) keeps names unique ignoring case/accents. */
export const suppliers = sqliteTable(
  'feed_suppliers',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    nameKey: text('name_key').notNull(),
    createdAt: text('created_at').notNull().default(now),
  },
  (table) => [uniqueIndex('feed_suppliers_name_key_unique').on(table.nameKey)],
);

/** Usual feeds of each favorite supplier. */
export const supplierFeeds = sqliteTable(
  'feed_supplier_feeds',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    supplierId: integer('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    nameKey: text('name_key').notNull(),
    createdAt: text('created_at').notNull().default(now),
  },
  (table) => [
    uniqueIndex('feed_supplier_feeds_supplier_name_key_unique').on(table.supplierId, table.nameKey),
  ],
);

/** Usual trucks of each favorite supplier. `plateKey` comes from the vehicles module. */
export const supplierTrucks = sqliteTable(
  'feed_supplier_trucks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    supplierId: integer('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    plate: text('plate').notNull(),
    plateKey: text('plate_key').notNull(),
    createdAt: text('created_at').notNull().default(now),
  },
  (table) => [
    uniqueIndex('feed_supplier_trucks_supplier_plate_key_unique').on(table.supplierId, table.plateKey),
  ],
);

/**
 * One row per product received. Supplier and feed names are snapshots of the
 * text used; the favorite ids are optional and become null if it is deleted.
 */
export const feedEntries = sqliteTable(
  'feed_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** ISO `YYYY-MM-DD` */
    date: text('date').notNull(),
    quantity: real('quantity').notNull(),
    unit: text('unit', { enum: FEED_UNITS }).notNull().default('kg'),
    supplierName: text('supplier_name').notNull(),
    supplierId: integer('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
    feedName: text('feed_name').notNull(),
    feedId: integer('feed_id').references(() => supplierFeeds.id, { onDelete: 'set null' }),
    invoice: text('invoice'),
    /** Plate of the delivery truck as used (snapshot); null if not given. */
    truckPlate: text('truck_plate'),
    truckId: integer('truck_id').references(() => supplierTrucks.id, { onDelete: 'set null' }),
    /** Automatic visit in the vehicles module for this truck and date. */
    vehicleVisitId: integer('vehicle_visit_id').references(() => vehicleVisits.id, {
      onDelete: 'set null',
    }),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [
    index('feed_entries_date_idx').on(table.date),
    index('feed_entries_supplier_name_idx').on(table.supplierName),
    index('feed_entries_vehicle_visit_idx').on(table.vehicleVisitId),
    check('feed_entries_quantity_positive', sql`${table.quantity} > 0`),
  ],
);

export type Supplier = typeof suppliers.$inferSelect;
export type SupplierFeed = typeof supplierFeeds.$inferSelect;
export type SupplierTruck = typeof supplierTrucks.$inferSelect;
export type FeedEntry = typeof feedEntries.$inferSelect;
