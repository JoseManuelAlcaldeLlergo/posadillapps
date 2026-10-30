import type { SyncDatabase } from '../db/types';

/** Invalid or incompatible backup file. `message` is shown to the user (Spanish). */
export class BackupFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupFormatError';
  }
}

/** Backup support provided by a module. `T` is its JSON-serializable data. */
export type ModuleBackup<T> = {
  /** Current version of this module's data format. */
  version: number;
  export: (db: SyncDatabase) => T;
  /**
   * Validates data written with `version` (≤ current). Receives `undefined`
   * when the file has no section for this module: return empty data.
   * Throws `BackupFormatError`.
   */
  parse: (data: unknown, version: number) => T;
  /** Deletes all of the module's rows. */
  clear: (tx: SyncDatabase) => void;
  /** Inserts the data, keeping ids. Runs after `clear`. */
  restore: (tx: SyncDatabase, data: T) => void;
  /** Short Spanish summary, e.g. `35 entradas, 2 proveedores`. */
  summary: (data: T) => string;
};

/** Keeps `T` when declaring a module's backup. */
export function defineModuleBackup<T>(backup: ModuleBackup<T>): ModuleBackup<T> {
  return backup;
}

/** What the backup engine needs from each registered module. */
export type BackupParticipant = {
  id: string;
  title: string;
  backup?: ModuleBackup<any>;
};

/** JSON file as written to disk. */
export type BackupFile = {
  app: typeof BACKUP_APP_ID;
  format: number;
  createdAt: string;
  modules: Record<string, { version: number; data: unknown }>;
};

/** A parsed, validated backup ready to restore. */
export type BackupContents = {
  createdAt: string;
  modules: { id: string; title: string; data: unknown; summary: string }[];
};

export const BACKUP_APP_ID = 'posadillapps';
export const BACKUP_FORMAT = 1;
