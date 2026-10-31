/**
 * @jest-environment node
 */
import { createTestDb } from '@/core/db/testing/createTestDb';
import type { SyncDatabase } from '@/core/db/types';
import { saveProduct } from '@/modules/cleaning-disinfection/productsRepository';
import { saveVisit } from '@/modules/vehicle-entries/repository';

import { loadFormSuggestions } from '../formSuggestions';
import {
  countOneOffsInRange,
  countPeriodicInYears,
  createOneOff,
  deletePeriodic,
  deleteVehicle,
  DuplicatePeriodicError,
  DuplicateVehicleError,
  frequencySuggestions,
  getPeriodic,
  lastRecordForPlate,
  listOneOffs,
  listOneOffsInRange,
  listPeriodic,
  listPeriodicInYears,
  listVehicles,
  previewYear,
  saveGeneratedYear,
  saveVehicle,
  updateOneOff,
  updatePeriodic,
  usedPlates,
  vehicleTypeSuggestions,
  yearsOfRange,
  type OneOffInput,
  type VehicleInput,
} from '../repository';
import { loadExportRows } from '../tableDefinition';

let db: SyncDatabase;
let close: () => void;

beforeEach(() => {
  ({ db, close } = createTestDb());
});

afterEach(() => close());

const vehicle = (overrides: Partial<VehicleInput> = {}): VehicleInput => ({
  plate: '6105 HHR',
  frequency: 'Semanalmente',
  productName: 'Cipergen',
  vehicleType: 'Turismo',
  active: true,
  ...overrides,
});

const oneOff = (overrides: Partial<OneOffInput> = {}): OneOffInput => ({
  date: '2023-05-10',
  plate: 'CO-46336-VE',
  productName: 'Virkon',
  vehicleType: 'Camión',
  reviewText: null,
  ...overrides,
});

function generate(year: number) {
  return saveGeneratedYear(db, year, previewYear(db, year).rows);
}

describe('vehicles of periodic cleaning', () => {
  it('lists active vehicles first, then by plate', () => {
    saveVehicle(db, vehicle({ plate: 'B 1', active: false }));
    saveVehicle(db, vehicle({ plate: 'C 1' }));
    saveVehicle(db, vehicle({ plate: 'A 1' }));
    expect(listVehicles(db).map((v) => v.plate)).toEqual(['A 1', 'C 1', 'B 1']);
  });

  it('accepts a chassis number and rejects a repeated plate ignoring spaces and hyphens', () => {
    const vin = saveVehicle(db, vehicle({ plate: 'VF1RFB00X56789012' }));
    expect(vin.plateKey).toBe('VF1RFB00X56789012');
    saveVehicle(db, vehicle({ plate: 'CO-46336-VE' }));
    expect(() => saveVehicle(db, vehicle({ plate: 'CO 46336 VE' }))).toThrow(DuplicateVehicleError);
    expect(() => saveVehicle(db, vehicle({ plate: 'VF1RFB00X56789012', frequency: 'A diario' }), vin.id)).not.toThrow();
  });
});

describe('generating a year', () => {
  it('proposes one row per active vehicle with the review text «{frecuencia} {año}»', () => {
    const a = saveVehicle(db, vehicle({ plate: 'A 1' }));
    saveVehicle(db, vehicle({ plate: 'B 1', active: false }));
    saveVehicle(db, vehicle({ plate: 'C 1', frequency: 'Mensualmente' }));
    const { rows, skipped } = previewYear(db, 2023);
    expect(skipped).toEqual([]);
    expect(rows).toEqual([
      {
        vehicleId: a.id,
        plate: 'A 1',
        frequency: 'Semanalmente',
        productName: 'Cipergen',
        vehicleType: 'Turismo',
        reviewText: 'Semanalmente 2023',
      },
      expect.objectContaining({ plate: 'C 1', reviewText: 'Mensualmente 2023' }),
    ]);
  });

  it('does not duplicate rows when the same year is generated again', () => {
    saveVehicle(db, vehicle({ plate: 'A 1' }));
    expect(generate(2023)).toEqual({ inserted: 1, skipped: 0 });
    saveVehicle(db, vehicle({ plate: 'B 1' }));

    const preview = previewYear(db, 2023);
    expect(preview.skipped.map((v) => v.plate)).toEqual(['A 1']);
    expect(preview.rows.map((r) => r.plate)).toEqual(['B 1']);
    expect(generate(2023)).toEqual({ inserted: 1, skipped: 0 });
    expect(generate(2023)).toEqual({ inserted: 0, skipped: 0 });
    expect(listPeriodic(db).map((r) => r.plate)).toEqual(['A 1', 'B 1']);
  });

  it('skips stale proposals when the year was saved meanwhile', () => {
    saveVehicle(db, vehicle({ plate: 'A 1' }));
    const stale = previewYear(db, 2023).rows;
    generate(2023);
    expect(saveGeneratedYear(db, 2023, [...stale, ...stale])).toEqual({ inserted: 0, skipped: 2 });
  });

  it('keeps generated rows when the vehicle is deleted', () => {
    const a = saveVehicle(db, vehicle({ plate: 'A 1' }));
    generate(2023);
    deleteVehicle(db, a.id);
    expect(listPeriodic(db)).toEqual([expect.objectContaining({ plate: 'A 1', vehicleId: null })]);
  });
});

describe('periodic cleanings', () => {
  it('updates texts and year, refusing a second row of the same plate and year', () => {
    saveVehicle(db, vehicle({ plate: 'A 1' }));
    saveVehicle(db, vehicle({ plate: 'B 1' }));
    generate(2023);
    const [a, b] = listPeriodic(db);
    const input = { ...a, year: 2023, plate: 'B-1', reviewText: null };
    expect(() => updatePeriodic(db, a.id, input)).toThrow(DuplicatePeriodicError);
    const updated = updatePeriodic(db, b.id, { ...b, year: 2024, reviewText: 'Revisado' });
    expect(updated).toMatchObject({ year: 2024, reviewText: 'Revisado', vehicleId: b.vehicleId });
    deletePeriodic(db, a.id);
    expect(getPeriodic(db, a.id)).toBeUndefined();
  });

  it('lists the newest year first and exports a year range oldest first, by plate', () => {
    saveVehicle(db, vehicle({ plate: 'B 1' }));
    saveVehicle(db, vehicle({ plate: 'A 1' }));
    generate(2022);
    generate(2023);
    generate(2024);
    expect(listPeriodic(db).map((r) => `${r.year} ${r.plate}`)).toEqual([
      '2024 A 1',
      '2024 B 1',
      '2023 A 1',
      '2023 B 1',
      '2022 A 1',
      '2022 B 1',
    ]);
    const range = { fromYear: 2023, toYear: 2024 };
    expect(listPeriodicInYears(db, range).map((r) => `${r.year} ${r.plate}`)).toEqual([
      '2023 A 1',
      '2023 B 1',
      '2024 A 1',
      '2024 B 1',
    ]);
    expect(countPeriodicInYears(db, range)).toBe(4);
  });
});

describe('one-off cleanings', () => {
  it('lists newest first and exports a date range oldest first, both ends inclusive', () => {
    createOneOff(db, oneOff({ date: '2023-01-01' }));
    createOneOff(db, oneOff({ date: '2023-03-31' }));
    createOneOff(db, oneOff({ date: '2023-04-01' }));
    createOneOff(db, oneOff({ date: '2022-12-31' }));
    const range = { from: '2023-01-01', to: '2023-03-31' };
    expect(listOneOffsInRange(db, range).map((r) => r.date)).toEqual(['2023-01-01', '2023-03-31']);
    expect(countOneOffsInRange(db, range)).toBe(2);
    expect(listOneOffs(db).map((r) => r.date)).toEqual([
      '2023-04-01',
      '2023-03-31',
      '2023-01-01',
      '2022-12-31',
    ]);
  });

  it('updates a cleaning and its plate key', () => {
    const created = createOneOff(db, oneOff());
    const updated = updateOneOff(db, created.id, oneOff({ plate: '1234 ABC', reviewText: 'Revisado' }));
    expect(updated).toMatchObject({ plate: '1234 ABC', plateKey: '1234ABC', reviewText: 'Revisado' });
  });
});

describe('filters', () => {
  it('filters periodic cleanings by the years of the range and both kinds by plate', () => {
    saveVehicle(db, vehicle({ plate: 'A 1' }));
    saveVehicle(db, vehicle({ plate: 'B 1' }));
    generate(2022);
    generate(2023);
    createOneOff(db, oneOff({ plate: 'A-1', date: '2023-06-01' }));
    createOneOff(db, oneOff({ plate: 'B 1', date: '2022-06-01' }));

    const filters = { from: '2023-01-01', to: '2023-12-31', plate: 'a1' };
    expect(listPeriodic(db, filters).map((r) => `${r.year} ${r.plate}`)).toEqual(['2023 A 1']);
    expect(listOneOffs(db, filters).map((r) => r.plate)).toEqual(['A-1']);
  });
});

describe('export rows', () => {
  it('takes the periodic cleanings of every year the range touches', () => {
    expect(yearsOfRange({ from: '2023-07-01', to: '2024-06-30' })).toEqual({ fromYear: 2023, toYear: 2024 });
    saveVehicle(db, vehicle({ plate: 'A 1' }));
    generate(2022);
    generate(2023);
    generate(2024);
    createOneOff(db, oneOff({ date: '2023-06-30' }));
    createOneOff(db, oneOff({ date: '2023-07-01' }));
    const rows = loadExportRows(db, { from: '2023-07-01', to: '2024-06-30' });
    expect(rows.map((r) => (r.kind === 'regular' ? r.year : r.date))).toEqual([2023, 2024, '2023-07-01']);
  });
});

describe('suggestions and autofill', () => {
  it('fills product and type from the last record with the plate', () => {
    createOneOff(db, oneOff({ plate: 'A 1', productName: 'Virkon', vehicleType: 'Camión' }));
    createOneOff(db, oneOff({ plate: 'A 1', productName: 'Cipergen', vehicleType: 'Tractor' }));
    expect(lastRecordForPlate(db, 'a-1')).toEqual({ productName: 'Cipergen', vehicleType: 'Tractor' });
    expect(lastRecordForPlate(db, 'Z 9')).toBeUndefined();
  });

  it('offers presets first, then used texts once each', () => {
    saveVehicle(db, vehicle({ plate: 'A 1', frequency: 'Cada 15 días', vehicleType: 'Furgoneta' }));
    createOneOff(db, oneOff({ vehicleType: 'camion' }));
    expect(frequencySuggestions(db)).toEqual(['A diario', 'Semanalmente', 'Mensualmente', 'Cada 15 días']);
    expect(vehicleTypeSuggestions(db)).toEqual(['Particular', 'Turismo', 'Camión', 'Tractor', 'Remolque', 'Furgoneta']);
  });

  it('suggests plates of vehicle entries and favorite products of cleaning and disinfection', () => {
    saveVisit(db, { date: '2023-01-01', plate: '6105 HHR', reason: 'Pienso', vehicleType: 'feed_truck' });
    saveVisit(db, { date: '2023-01-02', plate: 'A-1', reason: 'Pienso', vehicleType: 'feed_truck' });
    createOneOff(db, oneOff({ plate: 'A 1', productName: 'Zotal' }));
    saveProduct(db, { name: 'Cipergen', defaultWaitingDays: 0, defaultPlace: null });

    const suggestions = loadFormSuggestions(db);
    expect(suggestions.plates).toEqual(['A 1', '6105 HHR']);
    expect(suggestions.products).toEqual(['Cipergen', 'Zotal']);
    expect(usedPlates(db)).toEqual(['A 1']);
  });
});
