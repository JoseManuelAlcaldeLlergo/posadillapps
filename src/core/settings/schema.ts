import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Device-level key/value settings. Not included in backups. */
export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
