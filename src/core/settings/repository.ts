import { eq } from 'drizzle-orm';

import type { SyncDatabase } from '../db/types';
import { appSettings } from './schema';

const LAST_BACKUP_AT = 'lastBackupAt';

export function getSetting(db: SyncDatabase, key: string): string | null {
  const row: { value: string } | undefined = db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .get();
  return row?.value ?? null;
}

export function setSetting(db: SyncDatabase, key: string, value: string): void {
  db.insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value } })
    .run();
}

/** ISO timestamp of the last backup made or restored, or null if never. */
export function getLastBackupAt(db: SyncDatabase): string | null {
  return getSetting(db, LAST_BACKUP_AT);
}

/** Stores `iso` unless an equal or later backup is already recorded. */
export function setLastBackupAt(db: SyncDatabase, iso: string): void {
  const current = getLastBackupAt(db);
  if (current === null || iso > current) setSetting(db, LAST_BACKUP_AT, iso);
}
