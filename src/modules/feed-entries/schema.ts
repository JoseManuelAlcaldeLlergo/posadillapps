import { sql } from 'drizzle-orm';
import { check, index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [
    index('feed_entries_date_idx').on(table.date),
    index('feed_entries_supplier_name_idx').on(table.supplierName),
    check('feed_entries_quantity_positive', sql`${table.quantity} > 0`),
  ],
);

export type Supplier = typeof suppliers.$inferSelect;
export type SupplierFeed = typeof supplierFeeds.$inferSelect;
export type FeedEntry = typeof feedEntries.$inferSelect;
