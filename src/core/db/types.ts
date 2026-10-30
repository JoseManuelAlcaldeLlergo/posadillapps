import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

/**
 * Any synchronous SQLite database or transaction: expo-sqlite in the app,
 * better-sqlite3 in tests. Repositories take this so they can be tested.
 */
export type SyncDatabase = BaseSQLiteDatabase<'sync', any, any>;
