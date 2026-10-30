import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { toIsoDate } from '../dates';
import { exportFileName, formatDate } from '../export/format';

const SAFETY_COPY_NAME = 'antes-de-restaurar.json';

/** Writes the backup to the cache and opens the share sheet. */
export async function shareBackup(json: string, createdAt: string): Promise<void> {
  const suffix = formatDate(toIsoDate(new Date(createdAt)));
  const file = new File(Paths.cache, exportFileName('posadillapps-copia', 'json', suffix));
  if (file.exists) file.delete();
  await file.write(json);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Copia de seguridad',
  });
}

/** Opens the system picker. Returns the file text, or null if cancelled. */
export async function pickBackupFile(): Promise<string | null> {
  // Drive and other providers do not always label .json files as JSON;
  // the content is validated afterwards.
  const picked = await File.pickFileAsync({
    mimeTypes: ['application/json', 'application/octet-stream', 'text/plain', '*/*'],
  });
  if (picked.canceled) return null;
  return picked.result.text();
}

function safetyCopyFile(): File {
  return new File(new Directory(Paths.document, 'backups'), SAFETY_COPY_NAME);
}

/** Saves the current data before a restore, replacing the previous safety copy. */
export async function saveSafetyCopy(json: string): Promise<void> {
  const directory = new Directory(Paths.document, 'backups');
  if (!directory.exists) directory.create({ intermediates: true });
  const file = safetyCopyFile();
  if (file.exists) file.delete();
  await file.write(json);
}

/** Text of the copy saved before the last restore, or null if there is none. */
export async function readSafetyCopy(): Promise<string | null> {
  const file = safetyCopyFile();
  return file.exists ? file.text() : null;
}

export function hasSafetyCopy(): boolean {
  return safetyCopyFile().exists;
}

export function deleteSafetyCopy(): void {
  const file = safetyCopyFile();
  if (file.exists) file.delete();
}
