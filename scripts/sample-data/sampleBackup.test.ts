/**
 * @jest-environment node
 *
 * Checks that the sample data restores as a real backup. With
 * SAMPLE_BACKUP_OUT set (`npm run sample:backup`), also writes the file.
 */
import { writeFileSync } from 'node:fs';

import { createBackup, parseBackupFile, restoreBackup, serializeBackup } from '@/core/backup/backup';
import { createTestDb } from '@/core/db/testing/createTestDb';
import { farmBackupParticipant } from '@/core/farm';
import { modules } from '@/modules/registry';

import { seedSampleData } from './seedSampleData';

const participants = [farmBackupParticipant, ...modules];

test('sample data restores into an empty database', () => {
  const source = createTestDb();
  const target = createTestDb();
  try {
    seedSampleData(source.db, new Date());
    const json = serializeBackup(createBackup(source.db, participants));

    const contents = parseBackupFile(json, participants);
    restoreBackup(target.db, contents, participants);
    const restored = createBackup(target.db, participants, new Date(contents.createdAt));
    expect(serializeBackup(restored)).toBe(json);
    for (const module of contents.modules) expect(module.summary).not.toMatch(/^0 /);

    const out = process.env.SAMPLE_BACKUP_OUT;
    if (out) {
      writeFileSync(out, json);
      const lines = contents.modules.map((m) => `- ${m.title}: ${m.summary}`);
      console.log([`Copia de ejemplo escrita en ${out}:`, ...lines].join('\n'));
    }
  } finally {
    source.close();
    target.close();
  }
});
