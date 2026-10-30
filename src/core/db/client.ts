import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

export const DATABASE_NAME = 'posadillapps.db';

const sqlite = openDatabaseSync(DATABASE_NAME);
sqlite.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite);

export type Database = typeof db;
