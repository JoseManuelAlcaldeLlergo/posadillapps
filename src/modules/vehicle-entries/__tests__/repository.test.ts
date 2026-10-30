/**
 * @jest-environment node
 */
import { sql } from 'drizzle-orm';

import { createTestDb } from '@/core/db/testing/createTestDb';
import type { SyncDatabase } from '@/core/db/types';

import {
  AutomaticVisitError,
  countVisitsInRange,
  deleteAutomaticVisit,
  deleteVisit,
  frequencySuggestions,
  getVisit,
  lastRecordForPlate,
  linkAutomaticVisit,
  listActiveRegulars,
  listRegulars,
  listUsedPlates,
  listVisits,
  listVisitsInRange,
  reasonSuggestions,
  saveRegular,
  saveVisit,
  type AutomaticVisitInput,
  type RegularInput,
  type VisitInput,
} from '../repository';
import { countExportRows, loadExportRows } from '../tableDefinition';

let db: SyncDatabase;
let close: () => void;

beforeEach(() => {
  ({ db, close } = createTestDb());
});

afterEach(() => close());

function visit(overrides: Partial<VisitInput> = {}): VisitInput {
  return {
    date: '2025-03-31',
    plate: '6105 HHR',
    reason: 'Veterinario',
    vehicleType: 'private_car',
    ...overrides,
  };
}

function regular(overrides: Partial<RegularInput> = {}): RegularInput {
  return {
    plate: 'CO-46336-VE',
    frequency: 'A diario',
    reason: 'Control y cuidado de animales',
    vehicleType: 'private_car',
    active: true,
    ...overrides,
  };
}

const feedDelivery = (overrides: Partial<AutomaticVisitInput> = {}): AutomaticVisitInput => ({
  source: 'feed-entries',
  date: '2025-03-31',
  plate: '1234 BCD',
  reason: 'Transporte de pienso',
  vehicleType: 'feed_truck',
  ...overrides,
});

/** Makes `updated_at` deterministic: SQLite timestamps can tie within a millisecond. */
function setUpdatedAt(table: 'vehicle_visits' | 'vehicle_regulars', id: number, at: string) {
  db.run(sql.raw(`update ${table} set updated_at = '${at}' where id = ${id}`));
}

describe('visits by date range', () => {
  beforeEach(() => {
    saveVisit(db, visit({ date: '2024-12-31', plate: 'A' }));
    saveVisit(db, visit({ date: '2025-01-01', plate: 'B' }));
    saveVisit(db, visit({ date: '2025-06-30', plate: 'C', vehicleType: 'livestock_truck' }));
    saveVisit(db, visit({ date: '2025-12-31', plate: 'D' }));
    saveVisit(db, visit({ date: '2026-01-01', plate: 'E' }));
  });

  it('includes both ends of the range, oldest first', () => {
    const rows = listVisitsInRange(db, { from: '2025-01-01', to: '2025-12-31' });
    expect(rows.map((r) => r.plate)).toEqual(['B', 'C', 'D']);
    expect(countVisitsInRange(db, { from: '2025-01-01', to: '2025-12-31' })).toBe(3);
  });

  it('lists newest first with filters by date, plate and type', () => {
    expect(listVisits(db).map((r) => r.plate)).toEqual(['E', 'D', 'C', 'B', 'A']);
    expect(listVisits(db, { from: '2025-06-01' }).map((r) => r.plate)).toEqual(['E', 'D', 'C']);
    expect(listVisits(db, { vehicleType: 'livestock_truck' }).map((r) => r.plate)).toEqual(['C']);
  });
});

describe('plates', () => {
  it('stores plates normalized and finds them ignoring spaces and hyphens', () => {
    const saved = saveVisit(db, visit({ plate: ' co 46336-ve ' }));
    expect(saved.plate).toBe('CO 46336-VE');
    expect(saved.plateKey).toBe('CO46336VE');
    expect(listVisits(db, { plate: 'co-46336' })).toHaveLength(1);
    expect(listVisits(db, { plate: '6336 V' })).toHaveLength(1);
    expect(listVisits(db, { plate: 'XYZ' })).toHaveLength(0);
  });

  it('lists used plates once each, most recent first', () => {
    const a = saveVisit(db, visit({ plate: 'CO-46336-VE' }));
    const b = saveVisit(db, visit({ plate: 'co 46336 ve' }));
    const r = saveRegular(db, regular({ plate: '6105 HHR' }));
    setUpdatedAt('vehicle_visits', a.id, '2025-01-01T00:00:00.000Z');
    setUpdatedAt('vehicle_visits', b.id, '2025-01-03T00:00:00.000Z');
    setUpdatedAt('vehicle_regulars', r.id, '2025-01-02T00:00:00.000Z');
    expect(listUsedPlates(db)).toEqual(['CO 46336 VE', '6105 HHR']);
  });
});

describe('lastRecordForPlate', () => {
  it('returns type and reason of the most recent record with the plate', () => {
    const r = saveRegular(db, regular({ plate: '6105 HHR', reason: 'Veterinario', vehicleType: 'other' }));
    const v = saveVisit(db, visit({ plate: '6105-HHR', reason: 'Transporte de animales', vehicleType: 'livestock_truck' }));
    setUpdatedAt('vehicle_regulars', r.id, '2025-01-01T00:00:00.000Z');
    setUpdatedAt('vehicle_visits', v.id, '2025-01-02T00:00:00.000Z');
    expect(lastRecordForPlate(db, '6105hhr')).toEqual({
      reason: 'Transporte de animales',
      vehicleType: 'livestock_truck',
    });

    setUpdatedAt('vehicle_regulars', r.id, '2025-01-03T00:00:00.000Z');
    expect(lastRecordForPlate(db, '6105 HHR')).toEqual({ reason: 'Veterinario', vehicleType: 'other' });
  });

  it('returns nothing for unknown or empty plates', () => {
    expect(lastRecordForPlate(db, 'NUEVA')).toBeUndefined();
    expect(lastRecordForPlate(db, '  ')).toBeUndefined();
  });
});

describe('regular vehicles', () => {
  it('lists active first; only active ones are exported', () => {
    saveRegular(db, regular({ plate: 'A', active: false }));
    saveRegular(db, regular({ plate: 'B' }));
    saveRegular(db, regular({ plate: 'C' }));
    expect(listRegulars(db).map((r) => r.plate)).toEqual(['B', 'C', 'A']);
    expect(listActiveRegulars(db).map((r) => r.plate)).toEqual(['B', 'C']);
  });

  it('updates and keeps the active flag as a boolean', () => {
    const saved = saveRegular(db, regular());
    expect(saved.active).toBe(true);
    const updated = saveRegular(db, regular({ active: false, frequency: 'Semanalmente' }), saved.id);
    expect(updated).toMatchObject({ active: false, frequency: 'Semanalmente' });
  });
});

describe('export rows', () => {
  it('includes every active regular vehicle whatever the range, plus the visits in range', () => {
    saveRegular(db, regular({ plate: 'R1' }));
    saveRegular(db, regular({ plate: 'R2', active: false }));
    saveVisit(db, visit({ date: '2024-12-31', plate: 'FUERA' }));
    saveVisit(db, visit({ date: '2025-02-01', plate: 'DENTRO' }));
    const range = { from: '2025-01-01', to: '2025-12-31' };
    expect(loadExportRows(db, range).map((r) => [r.kind, r.plate])).toEqual([
      ['regular', 'R1'],
      ['visit', 'DENTRO'],
    ]);
    expect(countExportRows(db, range)).toBe(2);
  });
});

describe('suggestions', () => {
  it('offers presets first, then used reasons and frequencies', () => {
    saveVisit(db, visit({ reason: 'Revisión de la báscula' }));
    saveRegular(db, regular({ frequency: 'Cada 15 días', reason: 'veterinario' }));
    const reasons = reasonSuggestions(db);
    expect(reasons.slice(0, 6)).toContain('Veterinario');
    expect(reasons).toContain('Revisión de la báscula');
    expect(reasons.filter((r) => r.toLowerCase() === 'veterinario')).toHaveLength(1);
    expect(frequencySuggestions(db)).toEqual(['A diario', 'Semanalmente', 'Según guías', 'Cada 15 días']);
  });
});

describe('automatic visits', () => {
  it('creates one automatic visit per source, date and plate', () => {
    const first = linkAutomaticVisit(db, feedDelivery());
    const again = linkAutomaticVisit(db, feedDelivery({ plate: '1234-bcd' }));
    const otherDay = linkAutomaticVisit(db, feedDelivery({ date: '2025-04-01' }));
    expect(again.id).toBe(first.id);
    expect(otherDay.id).not.toBe(first.id);
    expect(first).toMatchObject({
      source: 'feed-entries',
      plate: '1234 BCD',
      reason: 'Transporte de pienso',
      vehicleType: 'feed_truck',
    });
  });

  it('does not merge with manual visits, which may repeat', () => {
    const manual = saveVisit(db, visit({ plate: '1234 BCD' }));
    saveVisit(db, visit({ plate: '1234 BCD' }));
    const automatic = linkAutomaticVisit(db, feedDelivery());
    expect(automatic.id).not.toBe(manual.id);
    expect(listVisits(db)).toHaveLength(3);
  });

  it('enforces uniqueness in the database too', () => {
    linkAutomaticVisit(db, feedDelivery());
    let error: unknown;
    try {
      db.run(sql`insert into vehicle_visits (date, plate, plate_key, reason, vehicle_type, source)
        values ('2025-03-31', '1234BCD', '1234BCD', 'x', 'other', 'feed-entries')`);
    } catch (e) {
      error = e;
    }
    // Drizzle wraps the SQLite error in `cause`.
    expect(String((error as Error | undefined)?.cause)).toMatch(/UNIQUE constraint failed/);
  });

  it('allows editing reason and type, but not date or plate', () => {
    const auto = linkAutomaticVisit(db, feedDelivery());
    const edited = saveVisit(
      db,
      { date: auto.date, plate: '1234-BCD', reason: 'Transporte de animales', vehicleType: 'livestock_truck' },
      auto.id,
    );
    expect(edited).toMatchObject({ reason: 'Transporte de animales', vehicleType: 'livestock_truck' });

    const input = { date: auto.date, plate: auto.plate, reason: auto.reason, vehicleType: auto.vehicleType };
    expect(() => saveVisit(db, { ...input, date: '2025-04-01' }, auto.id)).toThrow(AutomaticVisitError);
    expect(() => saveVisit(db, { ...input, plate: '9999 ZZZ' }, auto.id)).toThrow(AutomaticVisitError);
  });

  it('is deleted only through deleteAutomaticVisit', () => {
    const auto = linkAutomaticVisit(db, feedDelivery());
    const manual = saveVisit(db, visit());
    expect(() => deleteVisit(db, auto.id)).toThrow(AutomaticVisitError);

    deleteAutomaticVisit(db, manual.id);
    expect(getVisit(db, manual.id)).toBeDefined();
    deleteAutomaticVisit(db, auto.id);
    expect(getVisit(db, auto.id)).toBeUndefined();

    deleteVisit(db, manual.id);
    expect(getVisit(db, manual.id)).toBeUndefined();
  });

  it('runs inside the caller transaction', () => {
    expect(() =>
      db.transaction((tx) => {
        linkAutomaticVisit(tx, feedDelivery());
        throw new Error('rollback');
      }),
    ).toThrow('rollback');
    expect(listVisits(db)).toHaveLength(0);
  });
});
