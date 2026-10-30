/**
 * @jest-environment node
 */
import { createBackup, parseBackupFile, restoreBackup, serializeBackup } from '@/core/backup/backup';
import { createTestDb } from '@/core/db/testing/createTestDb';
import type { SyncDatabase } from '@/core/db/types';

import { vehicleEntriesBackup } from '../backup';
import { vehicleEntriesModule } from '../module';
import { linkAutomaticVisit, listRegulars, listVisits, saveRegular, saveVisit } from '../repository';

const modules = [vehicleEntriesModule];

function seed(db: SyncDatabase) {
  saveRegular(db, {
    plate: 'CO-46336-VE',
    frequency: 'A diario',
    reason: 'Control y cuidado de animales',
    vehicleType: 'private_car',
    active: false,
  });
  saveVisit(db, { date: '2025-03-31', plate: '6105 HHR', reason: 'Veterinario', vehicleType: 'other' });
  linkAutomaticVisit(db, {
    source: 'feed-entries',
    date: '2025-03-31',
    plate: '1234 BCD',
    reason: 'Transporte de pienso',
    vehicleType: 'feed_truck',
  });
}

function backupFile(data: unknown) {
  return JSON.stringify({
    app: 'posadillapps',
    format: 1,
    createdAt: '2026-01-01T00:00:00Z',
    modules: { 'vehicle-entries': { version: 1, data } },
  });
}

describe('vehicle-entries backup', () => {
  it('restores identical rows, ids, flags and sources', () => {
    const source = createTestDb();
    seed(source.db);
    const text = serializeBackup(createBackup(source.db, modules));

    const target = createTestDb();
    restoreBackup(target.db, parseBackupFile(text, modules), modules);

    expect(listRegulars(target.db)).toEqual(listRegulars(source.db));
    expect(listVisits(target.db)).toEqual(listVisits(source.db));
    expect(listRegulars(target.db)[0].active).toBe(false);
    source.close();
    target.close();
  });

  it('summarizes the data', () => {
    const { db, close } = createTestDb();
    seed(db);
    expect(vehicleEntriesBackup.summary(vehicleEntriesBackup.export(db))).toBe(
      '1 vehículo habitual, 2 visitas',
    );
    close();
  });

  it('restores as empty when the file has no section for the module', () => {
    expect(vehicleEntriesBackup.parse(undefined, 1)).toEqual({ regulars: [], visits: [] });
  });

  it.each([
    [{ regulars: [], visits: [{ id: 1, date: '2025-02-30' }] }, /visits\[0\]\.date/],
    [
      {
        regulars: [
          {
            id: 1,
            plate: 'X',
            plateKey: 'X',
            frequency: 'A diario',
            reason: 'Y',
            vehicleType: 'tractor',
            active: true,
            createdAt: 'x',
            updatedAt: 'x',
          },
        ],
        visits: [],
      },
      /tipo de vehículo desconocido «tractor»/,
    ],
    [
      {
        regulars: [
          {
            id: 1,
            plate: 'X',
            plateKey: 'X',
            frequency: 'A diario',
            reason: 'Y',
            vehicleType: 'other',
            active: 1,
            createdAt: 'x',
            updatedAt: 'x',
          },
        ],
        visits: [],
      },
      /regulars\[0\]\.active/,
    ],
    [{ regulars: 'no' }, /regulars/],
  ])('rejects invalid data %#', (data, message) => {
    expect(() => parseBackupFile(backupFile(data), modules)).toThrow(message);
  });
});
