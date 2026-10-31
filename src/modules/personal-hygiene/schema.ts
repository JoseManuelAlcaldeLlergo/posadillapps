import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

/**
 * Hygiene actions repeated every year. `result` and `dateText` may contain
 * `{año}`, replaced when a year is generated. Inactive ones are not generated.
 */
export const hygieneTemplates = sqliteTable('hygiene_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  productiveUnit: text('productive_unit').notNull(),
  place: text('place').notNull(),
  result: text('result').notNull(),
  correctiveMeasures: text('corrective_measures'),
  dateText: text('date_text').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  /** Order of the templates, also used for the rows generated from them. */
  sortOrder: integer('sort_order').notNull(),
  createdAt: text('created_at').notNull().default(now),
  updatedAt: text('updated_at').notNull().default(now),
});

/**
 * One row of the yearly plan. Every text is a snapshot: editing the template
 * or the farm settings does not change saved rows.
 */
export const hygieneRecords = sqliteTable(
  'hygiene_records',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    year: integer('year').notNull(),
    farmCode: text('farm_code').notNull(),
    productiveUnit: text('productive_unit').notNull(),
    action: text('action').notNull(),
    place: text('place').notNull(),
    result: text('result').notNull(),
    correctiveMeasures: text('corrective_measures'),
    /** FECHA column: a frequency such as `1 de cada mes 2013`, not a real date. */
    dateText: text('date_text').notNull(),
    /** Template it was created from; null if typed from scratch or the template was deleted. */
    templateId: integer('template_id').references(() => hygieneTemplates.id, { onDelete: 'set null' }),
    /** Order within the year: the template order when it was created. */
    position: integer('position').notNull(),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [
    index('hygiene_records_year_idx').on(table.year),
    index('hygiene_records_year_template_idx').on(table.year, table.templateId),
  ],
);

export type HygieneTemplate = typeof hygieneTemplates.$inferSelect;
export type HygieneRecord = typeof hygieneRecords.$inferSelect;
