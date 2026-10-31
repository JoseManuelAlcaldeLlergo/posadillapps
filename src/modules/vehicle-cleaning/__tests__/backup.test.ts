/**
 * @jest-environment node
 */
import { createBackup, parseBackupFile, restoreBackup, serializeBackup } from '@/core/backup/backup';
import { BackupFormatError } from '@/core/backup/types';
import { createTestDb } from '@/core/db/testing/createTestDb';
import { farmBackupParticipant } from '@/core/farm';

import { modules } from '@/modules/registry';

import { vehicleCleaningBackup } from '../backup';
import { createOneOff, listOneOffs, listPeriodic, listVehicles, previewYear, saveGeneratedYear, saveVehicle } from '../repository';

const participants = [farmBackupParticipant, ...modules];

describe('vehicleCleaningBackup', () => {
  it('round-trips vehicles, periodic and one-off cleanings with the other modules', () => {
    const source = createTestDb();
    const target = createTestDb();
    try {
      saveVehicle(source.db, {
        plate: '6105 HHR',
        frequency: 'Semanalmente',
        productName: 'Cipergen',
        vehicleType: 'Turismo',
        active: true,
      });
      saveGeneratedYear(source.db, 2023, previewYear(source.db, 2023).rows);
      createOneOff(source.db, {
        date: '2023-05-10',
        plate: 'CO-46336-VE',
        productName: 'Virkon',
        vehicleType: 'Camión',
        reviewText: null,
      });

      const contents = parseBackupFile(serializeBackup(createBackup(source.db, participants)), participants);
      expect(contents.modules.find((m) => m.id === 'vehicle-cleaning')?.summary).toBe(
        '1 limpieza periódica, 1 limpieza puntual, 1 vehículo',
      );
      restoreBackup(target.db, contents, participants);

      expect(listVehicles(target.db)).toEqual(listVehicles(source.db));
      expect(listPeriodic(target.db)).toEqual(listPeriodic(source.db));
      expect(listOneOffs(target.db)).toEqual(listOneOffs(source.db));
    } finally {
      source.close();
      target.close();
    }
  });

  it('accepts backups made before the module existed', () => {
    expect(vehicleCleaningBackup.parse(undefined, 1)).toEqual({ vehicles: [], periodic: [], oneOffs: [] });
  });

  it('rejects a periodic cleaning linked to a missing vehicle', () => {
    const periodic = {
      id: 1,
      year: 2023,
      vehicleId: 9,
      plate: 'A 1',
      plateKey: 'A1',
      frequency: 'Semanalmente',
      productName: 'Cipergen',
      vehicleType: 'Turismo',
      reviewText: null,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };
    expect(() => vehicleCleaningBackup.parse({ vehicles: [], periodic: [periodic], oneOffs: [] }, 1)).toThrow(
      BackupFormatError,
    );
  });
});
