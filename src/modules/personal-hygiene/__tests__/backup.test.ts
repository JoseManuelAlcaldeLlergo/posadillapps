/**
 * @jest-environment node
 */
import { createBackup, parseBackupFile, restoreBackup, serializeBackup } from '@/core/backup/backup';
import { BackupFormatError } from '@/core/backup/types';
import { createTestDb } from '@/core/db/testing/createTestDb';
import { farmBackupParticipant, getFarmCode, setFarmCode } from '@/core/farm';

import { modules } from '@/modules/registry';

import { personalHygieneBackup } from '../backup';
import { listRecords, previewYear, saveGeneratedYear } from '../repository';
import { listTemplates, saveTemplate } from '../templatesRepository';

const participants = [farmBackupParticipant, ...modules];

describe('personalHygieneBackup', () => {
  it('round-trips templates and rows with the other modules', () => {
    const source = createTestDb();
    const target = createTestDb();
    try {
      setFarmCode(source.db, 'ES140');
      saveTemplate(source.db, {
        action: 'Limpieza de manos, botas',
        productiveUnit: 'Ovino',
        place: 'Nave',
        result: 'Mensualmente año {año}',
        correctiveMeasures: null,
        dateText: '1 de cada mes {año}',
        active: true,
      });
      saveGeneratedYear(source.db, 2013, 'ES140', previewYear(source.db, 2013).rows);

      const contents = parseBackupFile(serializeBackup(createBackup(source.db, participants)), participants);
      expect(contents.modules.find((m) => m.id === 'personal-hygiene')?.summary).toBe('1 fila, 1 plantilla');
      restoreBackup(target.db, contents, participants);

      expect(getFarmCode(target.db)).toBe('ES140');
      expect(listTemplates(target.db)).toEqual(listTemplates(source.db));
      expect(listRecords(target.db)).toEqual(listRecords(source.db));
    } finally {
      source.close();
      target.close();
    }
  });

  it('rejects rows pointing to a missing template', () => {
    const record = {
      id: 1,
      year: 2013,
      farmCode: 'ES140',
      productiveUnit: 'Ovino',
      action: 'A',
      place: 'Nave',
      result: 'R',
      correctiveMeasures: null,
      dateText: 'F',
      templateId: 7,
      position: 0,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    expect(() => personalHygieneBackup.parse({ templates: [], records: [record] }, 1)).toThrow(
      BackupFormatError,
    );
  });

  it('returns empty data when the file has no section for the module', () => {
    expect(personalHygieneBackup.parse(undefined, 1)).toEqual({ templates: [], records: [] });
  });
});
