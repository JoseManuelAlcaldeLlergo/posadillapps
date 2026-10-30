import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'node:path';

import type { SyncDatabase } from '../types';

const MIGRATIONS_FOLDER = path.resolve(__dirname, '../migrations');

/**
 * In-memory SQLite with the app's real migrations applied. Tests only:
 * uses better-sqlite3, which is not bundled in the app.
 */
export function createTestDb(): { db: SyncDatabase; close: () => void } {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite);
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return { db, close: () => sqlite.close() };
}
