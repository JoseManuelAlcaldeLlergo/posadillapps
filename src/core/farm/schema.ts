import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

/** Data of the farm shared by every module. A single row with `id = 1`. */
export const farmSettings = sqliteTable(
  'farm_settings',
  {
    id: integer('id').primaryKey(),
    farmCode: text('farm_code').notNull(),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [check('farm_settings_single_row', sql`${table.id} = 1`)],
);

/** Productive units of the farm (e.g. Ovino, Porcino), offered as suggestions. */
export const productiveUnits = sqliteTable(
  'farm_productive_units',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    /** `nameKey(name)`: unique ignoring case and accents. */
    nameKey: text('name_key').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: text('created_at').notNull().default(now),
  },
  (table) => [uniqueIndex('farm_productive_units_name_key_unique').on(table.nameKey)],
);

export type FarmSettings = typeof farmSettings.$inferSelect;
export type ProductiveUnit = typeof productiveUnits.$inferSelect;
