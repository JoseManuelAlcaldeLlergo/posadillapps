import type { SyncDatabase } from '../db/types';
import {
  BACKUP_APP_ID,
  BACKUP_FORMAT,
  BackupFormatError,
  type BackupContents,
  type BackupFile,
  type BackupParticipant,
} from './types';
import { isRecord, requireInteger, requireRecord } from './validate';

const NOT_A_BACKUP = 'El archivo no es una copia de seguridad de PosadillApps';
const NEWER_APP = 'La copia es de una versión más nueva de la app. Actualiza la app y vuelve a intentarlo.';

function withBackup(modules: readonly BackupParticipant[]) {
  return modules.filter(
    (module): module is BackupParticipant & { backup: NonNullable<BackupParticipant['backup']> } =>
      module.backup !== undefined,
  );
}

/** Snapshot of every module that supports backups. */
export function createBackup(
  db: SyncDatabase,
  modules: readonly BackupParticipant[],
  now: Date = new Date(),
): BackupFile {
  return {
    app: BACKUP_APP_ID,
    format: BACKUP_FORMAT,
    createdAt: now.toISOString(),
    modules: Object.fromEntries(
      withBackup(modules).map((module) => [
        module.id,
        { version: module.backup.version, data: module.backup.export(db) },
      ]),
    ),
  };
}

export function serializeBackup(file: BackupFile): string {
  return JSON.stringify(file, null, 2);
}

/** Summary of the current data, per module, as shown before making a backup. */
export function describeBackup(file: BackupFile, modules: readonly BackupParticipant[]) {
  return withBackup(modules).map((module) => ({
    id: module.id,
    title: module.title,
    summary: module.backup.summary(file.modules[module.id]?.data),
  }));
}

/**
 * Parses and validates a backup file. Modules missing from the file restore
 * as empty; unknown modules or newer versions are rejected.
 */
export function parseBackupFile(text: string, modules: readonly BackupParticipant[]): BackupContents {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new BackupFormatError(NOT_A_BACKUP);
  }
  if (!isRecord(json) || json.app !== BACKUP_APP_ID) throw new BackupFormatError(NOT_A_BACKUP);

  const format = requireInteger(json.format, 'format');
  if (format > BACKUP_FORMAT) throw new BackupFormatError(NEWER_APP);

  const createdAt = typeof json.createdAt === 'string' ? json.createdAt : '';
  if (Number.isNaN(Date.parse(createdAt))) throw new BackupFormatError(NOT_A_BACKUP);

  const fileModules = requireRecord(json.modules, 'modules');
  const known = withBackup(modules);
  if (Object.keys(fileModules).some((id) => !known.some((module) => module.id === id))) {
    throw new BackupFormatError(NEWER_APP);
  }

  return {
    createdAt,
    modules: known.map((module) => {
      const entry = fileModules[module.id];
      let data: unknown;
      if (entry === undefined) {
        data = module.backup.parse(undefined, module.backup.version);
      } else {
        const section = requireRecord(entry, `modules.${module.id}`);
        const version = requireInteger(section.version, `modules.${module.id}.version`);
        if (version > module.backup.version) throw new BackupFormatError(NEWER_APP);
        data = module.backup.parse(section.data, version);
      }
      return { id: module.id, title: module.title, data, summary: module.backup.summary(data) };
    }),
  };
}

/**
 * Replaces all module data with the backup, in one transaction: if anything
 * fails, nothing changes. Clears in reverse registry order so later modules
 * can reference earlier ones.
 */
export function restoreBackup(
  db: SyncDatabase,
  contents: BackupContents,
  modules: readonly BackupParticipant[],
): void {
  const known = withBackup(modules);
  db.transaction((tx) => {
    for (const module of [...known].reverse()) module.backup.clear(tx);
    for (const module of known) {
      const section = contents.modules.find((m) => m.id === module.id);
      if (section) module.backup.restore(tx, section.data);
    }
  });
}
