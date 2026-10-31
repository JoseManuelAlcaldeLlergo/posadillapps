import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

/** Favorite products with the values filled in when one is picked in a form. */
export const cleaningProducts = sqliteTable(
  'cleaning_products',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    /** `nameKey(name)`: unique ignoring case and accents. */
    nameKey: text('name_key').notNull(),
    defaultWaitingDays: integer('default_waiting_days').notNull().default(0),
    defaultPlace: text('default_place'),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [
    uniqueIndex('cleaning_products_name_key_unique').on(table.nameKey),
    check('cleaning_products_waiting_days_non_negative', sql`${table.defaultWaitingDays} >= 0`),
  ],
);

/**
 * Applications made with a fixed frequency and not written down each time
 * (e.g. water in the drinkers, `A diario`). Inactive ones are kept but no
 * longer exported. Texts are snapshots; `productId` becomes null if the
 * favorite is deleted.
 */
export const cleaningRegulars = sqliteTable(
  'cleaning_regulars',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    farmCode: text('farm_code').notNull(),
    productiveUnit: text('productive_unit').notNull(),
    frequency: text('frequency').notNull(),
    productName: text('product_name').notNull(),
    /** `nameKey(productName)`, for the product filter. */
    productKey: text('product_key').notNull(),
    productId: integer('product_id').references(() => cleaningProducts.id, { onDelete: 'set null' }),
    place: text('place').notNull(),
    waitingDays: integer('waiting_days').notNull(),
    /** ISO `YYYY-MM-DD`, or null if not reviewed. */
    reviewDate: text('review_date'),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [
    index('cleaning_regulars_product_key_idx').on(table.productKey),
    check('cleaning_regulars_waiting_days_non_negative', sql`${table.waitingDays} >= 0`),
  ],
);

/** One application on a given date. Same snapshots as regular applications. */
export const cleaningApplications = sqliteTable(
  'cleaning_applications',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** ISO `YYYY-MM-DD` */
    date: text('date').notNull(),
    farmCode: text('farm_code').notNull(),
    productiveUnit: text('productive_unit').notNull(),
    productName: text('product_name').notNull(),
    productKey: text('product_key').notNull(),
    productId: integer('product_id').references(() => cleaningProducts.id, { onDelete: 'set null' }),
    place: text('place').notNull(),
    waitingDays: integer('waiting_days').notNull(),
    reviewDate: text('review_date'),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [
    index('cleaning_applications_date_idx').on(table.date),
    index('cleaning_applications_product_key_idx').on(table.productKey),
    check('cleaning_applications_waiting_days_non_negative', sql`${table.waitingDays} >= 0`),
  ],
);

export type CleaningProduct = typeof cleaningProducts.$inferSelect;
export type CleaningRegular = typeof cleaningRegulars.$inferSelect;
export type CleaningApplication = typeof cleaningApplications.$inferSelect;
