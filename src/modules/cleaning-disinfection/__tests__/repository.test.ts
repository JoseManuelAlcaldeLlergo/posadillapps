/**
 * @jest-environment node
 */
import { sql } from 'drizzle-orm';

import { createTestDb } from '@/core/db/testing/createTestDb';
import type { SyncDatabase } from '@/core/db/types';
import { addProductiveUnit } from '@/core/farm';

import { defaultProductiveUnit } from '../formSuggestions';
import {
  deleteProduct,
  DuplicateProductError,
  findProductByName,
  listProducts,
  saveProduct,
} from '../productsRepository';
import {
  countApplicationsInRange,
  createApplication,
  createRegular,
  frequencySuggestions,
  getApplication,
  lastProductiveUnit,
  listActiveRegulars,
  listApplications,
  listApplicationsInRange,
  listRegulars,
  placeSuggestions,
  updateApplication,
  updateRegular,
  usedProductNames,
  type ApplicationInput,
  type RegularInput,
} from '../repository';
import { countExportRows, loadExportRows } from '../tableDefinition';

let db: SyncDatabase;
let close: () => void;

beforeEach(() => {
  ({ db, close } = createTestDb());
});

afterEach(() => close());

const FARM = 'ES140000000000';

function application(overrides: Partial<ApplicationInput> = {}): ApplicationInput {
  return {
    date: '2025-03-31',
    productiveUnit: 'Ovino',
    productName: 'Cal en polvo',
    place: 'Naves, suelo y paredes',
    waitingDays: 0,
    reviewDate: null,
    ...overrides,
  };
}

function regular(overrides: Partial<RegularInput> = {}): RegularInput {
  return {
    productiveUnit: 'Ovino',
    productName: 'Agua',
    place: 'Bebederos',
    waitingDays: 0,
    reviewDate: null,
    frequency: 'A diario',
    active: true,
    ...overrides,
  };
}

/** Makes `updated_at` deterministic: SQLite timestamps can tie within a millisecond. */
function setUpdatedAt(table: 'cleaning_applications' | 'cleaning_regulars', id: number, at: string) {
  db.run(sql.raw(`update ${table} set updated_at = '${at}' where id = ${id}`));
}

describe('applications by date range', () => {
  beforeEach(() => {
    createApplication(db, application({ date: '2024-12-31', place: 'A' }), FARM);
    createApplication(db, application({ date: '2025-01-01', place: 'B' }), FARM);
    createApplication(db, application({ date: '2025-06-30', place: 'C', productName: 'Cipergen' }), FARM);
    createApplication(db, application({ date: '2025-12-31', place: 'D' }), FARM);
    createApplication(db, application({ date: '2026-01-01', place: 'E' }), FARM);
  });

  it('includes both ends of the range, oldest first', () => {
    const range = { from: '2025-01-01', to: '2025-12-31' };
    expect(listApplicationsInRange(db, range).map((a) => a.place)).toEqual(['B', 'C', 'D']);
    expect(countApplicationsInRange(db, range)).toBe(3);
  });

  it('lists newest first, filtered by dates and product ignoring case and accents', () => {
    expect(listApplications(db).map((a) => a.place)).toEqual(['E', 'D', 'C', 'B', 'A']);
    expect(listApplications(db, { from: '2025-06-01' }).map((a) => a.place)).toEqual(['E', 'D', 'C']);
    expect(listApplications(db, { product: 'CIPERGEN' }).map((a) => a.place)).toEqual(['C']);
    expect(listApplications(db, { to: '2025-01-01', product: 'cal en polvo' }).map((a) => a.place)).toEqual([
      'B',
      'A',
    ]);
  });
});

describe('snapshots', () => {
  it('keeps the farm code it was created with', () => {
    const saved = createApplication(db, application(), FARM);
    const updated = updateApplication(db, saved.id, application({ place: 'Patio' }));
    expect(updated).toMatchObject({ farmCode: FARM, place: 'Patio' });
  });

  it('links to the favorite but keeps its own values when the favorite changes', () => {
    const product = saveProduct(db, { name: 'Cipergen', defaultWaitingDays: 15, defaultPlace: 'Naves' });
    const saved = createApplication(db, application({ productName: 'cipergen', waitingDays: 15 }), FARM);
    expect(saved).toMatchObject({ productId: product.id, productName: 'cipergen', waitingDays: 15 });

    saveProduct(db, { name: 'Cipergen', defaultWaitingDays: 21, defaultPlace: null }, product.id);
    expect(getApplication(db, saved.id)).toMatchObject({ waitingDays: 15, place: 'Naves, suelo y paredes' });

    deleteProduct(db, product.id);
    expect(getApplication(db, saved.id)).toMatchObject({ productId: null, productName: 'cipergen' });
  });
});

describe('favorite products', () => {
  it('rejects duplicate names ignoring case and accents', () => {
    saveProduct(db, { name: 'Cal en polvo', defaultWaitingDays: 0, defaultPlace: null });
    expect(() => saveProduct(db, { name: ' cal en  POLVO ', defaultWaitingDays: 0, defaultPlace: null })).toThrow(
      DuplicateProductError,
    );
  });

  it('is created from a record only when asked, with its waiting period and place', () => {
    createApplication(db, application({ productName: 'Zotal' }), FARM);
    expect(listProducts(db)).toHaveLength(0);

    createApplication(db, application({ productName: 'Zotal', waitingDays: 7, place: 'Fosas' }), FARM, {
      saveProduct: true,
    });
    expect(findProductByName(db, 'zotal')).toMatchObject({
      name: 'Zotal',
      defaultWaitingDays: 7,
      defaultPlace: 'Fosas',
    });

    // Already a favorite: links to it, does not create another.
    const again = createApplication(db, application({ productName: 'ZOTAL' }), FARM, { saveProduct: true });
    expect(listProducts(db)).toHaveLength(1);
    expect(again.productId).toBe(findProductByName(db, 'Zotal')?.id);
  });
});

describe('regular applications', () => {
  it('lists active first; only active ones are exported', () => {
    createRegular(db, regular({ place: 'A', active: false }), FARM);
    createRegular(db, regular({ place: 'B' }), FARM);
    createRegular(db, regular({ place: 'C', productName: 'Cal' }), FARM);
    expect(listRegulars(db).map((r) => r.place)).toEqual(['B', 'C', 'A']);
    expect(listRegulars(db, { product: 'cal' }).map((r) => r.place)).toEqual(['C']);
    expect(listActiveRegulars(db).map((r) => r.place)).toEqual(['B', 'C']);
  });

  it('updates and keeps the active flag as a boolean', () => {
    const saved = createRegular(db, regular(), FARM);
    expect(saved.active).toBe(true);
    const updated = updateRegular(db, saved.id, regular({ active: false, frequency: 'Semanalmente' }));
    expect(updated).toMatchObject({ active: false, frequency: 'Semanalmente', farmCode: FARM });
  });
});

describe('export rows', () => {
  it('includes every active regular application whatever the range, plus the applications in range', () => {
    createRegular(db, regular({ place: 'R1' }), FARM);
    createRegular(db, regular({ place: 'R2', active: false }), FARM);
    createApplication(db, application({ date: '2024-12-31', place: 'FUERA' }), FARM);
    createApplication(db, application({ date: '2025-02-01', place: 'DENTRO' }), FARM);
    const range = { from: '2025-01-01', to: '2025-12-31' };
    expect(loadExportRows(db, range).map((r) => [r.kind, r.place])).toEqual([
      ['regular', 'R1'],
      ['application', 'DENTRO'],
    ]);
    expect(countExportRows(db, range)).toBe(2);
  });
});

describe('suggestions and defaults', () => {
  it('offers presets first, then used frequencies and places', () => {
    createRegular(db, regular({ frequency: 'Cada 15 días', place: 'bebederos' }), FARM);
    saveProduct(db, { name: 'Raticida', defaultWaitingDays: 0, defaultPlace: 'Almacén' });
    expect(frequencySuggestions(db)).toEqual(['A diario', 'Semanalmente', 'Mensualmente', 'Cada 15 días']);
    expect(placeSuggestions(db)).toEqual(['Naves, suelo y paredes', 'Bebederos', 'Almacén']);
  });

  it('lists products of favorites and records once each', () => {
    saveProduct(db, { name: 'Cal en polvo', defaultWaitingDays: 0, defaultPlace: null });
    createApplication(db, application({ productName: 'cal en polvo' }), FARM);
    createRegular(db, regular({ productName: 'Agua' }), FARM);
    expect(usedProductNames(db)).toEqual(['Agua', 'Cal en polvo']);
  });

  it('preselects the last used productive unit, else the first in the farm settings', () => {
    expect(defaultProductiveUnit(db)).toBe('');
    addProductiveUnit(db, 'Porcino');
    addProductiveUnit(db, 'Ovino');
    expect(defaultProductiveUnit(db)).toBe('Porcino');

    const a = createApplication(db, application({ productiveUnit: 'Ovino' }), FARM);
    const r = createRegular(db, regular({ productiveUnit: 'Caprino' }), FARM);
    setUpdatedAt('cleaning_applications', a.id, '2025-01-02T00:00:00.000Z');
    setUpdatedAt('cleaning_regulars', r.id, '2025-01-01T00:00:00.000Z');
    expect(lastProductiveUnit(db)).toBe('Ovino');
    expect(defaultProductiveUnit(db)).toBe('Ovino');
  });
});
