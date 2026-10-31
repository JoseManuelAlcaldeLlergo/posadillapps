/**
 * @jest-environment node
 */
import { createBackup, parseBackupFile, restoreBackup, serializeBackup } from '../../backup/backup';
import { BackupFormatError } from '../../backup/types';
import { createTestDb } from '../../db/testing/createTestDb';
import type { SyncDatabase } from '../../db/types';
import { farmBackupParticipant } from '../backup';
import {
  addProductiveUnit,
  deleteProductiveUnit,
  DuplicateNameError,
  getFarmCode,
  listProductiveUnits,
  moveProductiveUnit,
  setFarmCode,
} from '../repository';

let db: SyncDatabase;
let close: () => void;

beforeEach(() => {
  ({ db, close } = createTestDb());
});

afterEach(() => close());

const names = () => listProductiveUnits(db).map((unit) => unit.name);

describe('farm code', () => {
  it('is null until it is set', () => {
    expect(getFarmCode(db)).toBeNull();
  });

  it('saves the normalized code and replaces it', () => {
    expect(setFarmCode(db, '  ES 140 ')).toBe('ES 140');
    expect(getFarmCode(db)).toBe('ES 140');
    setFarmCode(db, 'ES141');
    expect(getFarmCode(db)).toBe('ES141');
  });

  it('unsets it when empty', () => {
    setFarmCode(db, 'ES140');
    expect(setFarmCode(db, '  ')).toBeNull();
    expect(getFarmCode(db)).toBeNull();
  });
});

describe('productive units', () => {
  it('adds units at the end, normalized', () => {
    addProductiveUnit(db, ' Ovino ');
    addProductiveUnit(db, 'Porcino');
    addProductiveUnit(db, 'Ovino   y porcino');
    expect(names()).toEqual(['Ovino', 'Porcino', 'Ovino y porcino']);
  });

  it('rejects duplicates ignoring case and accents, and empty names', () => {
    addProductiveUnit(db, 'Ovino');
    expect(() => addProductiveUnit(db, 'óvino')).toThrow(DuplicateNameError);
    expect(() => addProductiveUnit(db, ' ')).toThrow('Name is required');
  });

  it('moves units up and down, ignoring moves past the ends', () => {
    const ovino = addProductiveUnit(db, 'Ovino');
    addProductiveUnit(db, 'Porcino');
    const mixed = addProductiveUnit(db, 'Ovino y porcino');
    moveProductiveUnit(db, mixed.id, -1);
    expect(names()).toEqual(['Ovino', 'Ovino y porcino', 'Porcino']);
    moveProductiveUnit(db, ovino.id, 1);
    expect(names()).toEqual(['Ovino y porcino', 'Ovino', 'Porcino']);
    moveProductiveUnit(db, mixed.id, -1);
    expect(names()).toEqual(['Ovino y porcino', 'Ovino', 'Porcino']);
  });

  it('deletes a unit and adds new ones after the last', () => {
    const ovino = addProductiveUnit(db, 'Ovino');
    addProductiveUnit(db, 'Porcino');
    deleteProductiveUnit(db, ovino.id);
    addProductiveUnit(db, 'Ovino');
    expect(names()).toEqual(['Porcino', 'Ovino']);
  });
});

describe('farm backup', () => {
  const participants = [farmBackupParticipant];

  it('round-trips the code and the units', () => {
    setFarmCode(db, 'ES140');
    addProductiveUnit(db, 'Ovino');
    addProductiveUnit(db, 'Porcino');
    const text = serializeBackup(createBackup(db, participants));

    const other = createTestDb();
    try {
      setFarmCode(other.db, 'OTRO');
      addProductiveUnit(other.db, 'Vacuno');
      const contents = parseBackupFile(text, participants);
      expect(contents.modules[0].summary).toBe('código ES140, 2 unidades productivas');
      restoreBackup(other.db, contents, participants);
      expect(getFarmCode(other.db)).toBe('ES140');
      expect(listProductiveUnits(other.db).map((unit) => unit.name)).toEqual(['Ovino', 'Porcino']);
    } finally {
      other.close();
    }
  });

  it('restores as empty from files without farm settings', () => {
    setFarmCode(db, 'ES140');
    addProductiveUnit(db, 'Ovino');
    const text = JSON.stringify({
      app: 'posadillapps',
      format: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
      modules: {},
    });
    const contents = parseBackupFile(text, participants);
    expect(contents.modules[0].summary).toBe('sin código de explotación, 0 unidades productivas');
    restoreBackup(db, contents, participants);
    expect(getFarmCode(db)).toBeNull();
    expect(names()).toEqual([]);
  });

  it('rejects repeated units', () => {
    const unit = { name: 'Ovino', nameKey: 'ovino', sortOrder: 0, createdAt: '2025-01-01T00:00:00.000Z' };
    const data = { farmCode: 'ES140', productiveUnits: [{ ...unit, id: 1 }, { ...unit, id: 2 }] };
    expect(() => farmBackupParticipant.backup?.parse(data, 1)).toThrow(BackupFormatError);
  });
});
