/**
 * @jest-environment node
 */
import { createBackup, parseBackupFile, restoreBackup, serializeBackup } from '@/core/backup/backup';
import { BackupFormatError } from '@/core/backup/types';
import { createTestDb } from '@/core/db/testing/createTestDb';
import { farmBackupParticipant } from '@/core/farm';

import { modules } from '@/modules/registry';

import { cleaningDisinfectionBackup } from '../backup';
import { listProducts, saveProduct } from '../productsRepository';
import { createApplication, createRegular, listApplications, listRegulars } from '../repository';

const participants = [farmBackupParticipant, ...modules];

describe('cleaningDisinfectionBackup', () => {
  it('round-trips products, regular applications and applications with the other modules', () => {
    const source = createTestDb();
    const target = createTestDb();
    try {
      saveProduct(source.db, { name: 'Cipergen', defaultWaitingDays: 15, defaultPlace: 'Naves' });
      const fields = {
        productiveUnit: 'Ovino',
        productName: 'Cipergen',
        place: 'Naves',
        waitingDays: 15,
        reviewDate: '2025-04-01',
      };
      createRegular(source.db, { ...fields, frequency: 'Mensualmente', active: true }, 'ES140');
      createApplication(source.db, { ...fields, date: '2025-03-31' }, 'ES140');

      const contents = parseBackupFile(serializeBackup(createBackup(source.db, participants)), participants);
      expect(contents.modules.find((m) => m.id === 'cleaning-disinfection')?.summary).toBe(
        '1 aplicación, 1 aplicación habitual, 1 producto',
      );
      restoreBackup(target.db, contents, participants);

      expect(listProducts(target.db)).toEqual(listProducts(source.db));
      expect(listRegulars(target.db)).toEqual(listRegulars(source.db));
      expect(listApplications(target.db)).toEqual(listApplications(source.db));
    } finally {
      source.close();
      target.close();
    }
  });

  it('treats a file without this module as empty', () => {
    expect(cleaningDisinfectionBackup.parse(undefined, 1)).toEqual({
      products: [],
      regulars: [],
      applications: [],
    });
  });

  it('rejects links to missing products and negative waiting periods', () => {
    const application = {
      id: 1,
      date: '2025-03-31',
      farmCode: 'ES140',
      productiveUnit: 'Ovino',
      productName: 'Cal',
      productKey: 'cal',
      productId: 9,
      place: 'Naves',
      waitingDays: 0,
      reviewDate: null,
      createdAt: 'x',
      updatedAt: 'x',
    };
    expect(() =>
      cleaningDisinfectionBackup.parse({ products: [], regulars: [], applications: [application] }, 1),
    ).toThrow(BackupFormatError);
    expect(() =>
      cleaningDisinfectionBackup.parse(
        { products: [], regulars: [], applications: [{ ...application, productId: null, waitingDays: -1 }] },
        1,
      ),
    ).toThrow(BackupFormatError);
  });
});
