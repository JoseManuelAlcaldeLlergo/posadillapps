/**
 * @jest-environment node
 */
import { createTestDb } from '@/core/db/testing/createTestDb';
import type { SyncDatabase } from '@/core/db/types';

import {
  addFeed,
  createSupplier,
  deleteFeed,
  deleteSupplier,
  DuplicateNameError,
  getSupplierWithFeeds,
  listSuppliersWithFeeds,
  renameFeed,
  renameSupplier,
} from '../favoritesRepository';
import {
  countEntriesInRange,
  deleteEntry,
  getEntry,
  listEntries,
  listEntriesInRange,
  listEntrySupplierNames,
  saveEntry,
  type EntryInput,
} from '../repository';

let db: SyncDatabase;
let close: () => void;

beforeEach(() => {
  ({ db, close } = createTestDb());
});

afterEach(() => close());

function entry(overrides: Partial<EntryInput> = {}): EntryInput {
  return {
    date: '2025-03-31',
    quantity: 9340,
    unit: 'kg',
    supplierName: 'Mezclas del Valle',
    feedName: 'Cerdos crecimiento',
    invoice: 'F2000 525',
    ...overrides,
  };
}

describe('date range queries', () => {
  beforeEach(() => {
    saveEntry(db, entry({ date: '2024-12-31', invoice: 'A' }));
    saveEntry(db, entry({ date: '2025-01-01', invoice: 'B' }));
    saveEntry(db, entry({ date: '2025-06-30', invoice: 'C', supplierName: 'Sierra de los Santos SCA' }));
    saveEntry(db, entry({ date: '2025-12-31', invoice: 'D' }));
    saveEntry(db, entry({ date: '2026-01-01', invoice: 'E' }));
  });

  it('includes both ends of the range, oldest first', () => {
    const rows = listEntriesInRange(db, { from: '2025-01-01', to: '2025-12-31' });
    expect(rows.map((r) => r.invoice)).toEqual(['B', 'C', 'D']);
    expect(countEntriesInRange(db, { from: '2025-01-01', to: '2025-12-31' })).toBe(3);
  });

  it('returns nothing for an empty range', () => {
    expect(listEntriesInRange(db, { from: '2025-02-01', to: '2025-02-28' })).toEqual([]);
    expect(countEntriesInRange(db, { from: '2025-02-01', to: '2025-02-28' })).toBe(0);
  });

  it('lists newest first, with open-ended and supplier filters', () => {
    expect(listEntries(db).map((r) => r.invoice)).toEqual(['E', 'D', 'C', 'B', 'A']);
    expect(listEntries(db, { from: '2025-06-30' }).map((r) => r.invoice)).toEqual(['E', 'D', 'C']);
    expect(listEntries(db, { to: '2025-01-01' }).map((r) => r.invoice)).toEqual(['B', 'A']);
    expect(
      listEntries(db, { supplierName: 'Sierra de los Santos SCA' }).map((r) => r.invoice),
    ).toEqual(['C']);
  });

  it('orders entries of the same date by creation', () => {
    saveEntry(db, entry({ date: '2025-06-30', invoice: 'C2' }));
    expect(
      listEntriesInRange(db, { from: '2025-06-30', to: '2025-06-30' }).map((r) => r.invoice),
    ).toEqual(['C', 'C2']);
  });

  it('lists distinct supplier names', () => {
    expect(listEntrySupplierNames(db)).toEqual(['Mezclas del Valle', 'Sierra de los Santos SCA']);
  });
});

describe('saveEntry', () => {
  it('creates, updates and deletes an entry', () => {
    const created = saveEntry(db, entry());
    expect(created).toMatchObject({
      date: '2025-03-31',
      quantity: 9340,
      unit: 'kg',
      supplierName: 'Mezclas del Valle',
      feedName: 'Cerdos crecimiento',
      invoice: 'F2000 525',
      supplierId: null,
      feedId: null,
    });

    const updated = saveEntry(db, entry({ quantity: 1234.5, unit: 't', invoice: null }), undefined, created.id);
    expect(updated).toMatchObject({ id: created.id, quantity: 1234.5, unit: 't', invoice: null });
    expect(listEntries(db)).toHaveLength(1);

    deleteEntry(db, created.id);
    expect(getEntry(db, created.id)).toBeUndefined();
  });

  it('creates missing favorites when asked', () => {
    const saved = saveEntry(db, entry(), { saveSupplier: true, saveFeed: true });
    const [supplier] = listSuppliersWithFeeds(db);
    expect(supplier.name).toBe('Mezclas del Valle');
    expect(supplier.feeds.map((f) => f.name)).toEqual(['Cerdos crecimiento']);
    expect(saved.supplierId).toBe(supplier.id);
    expect(saved.feedId).toBe(supplier.feeds[0].id);
  });

  it('does not create favorites unless asked', () => {
    saveEntry(db, entry(), { saveSupplier: false, saveFeed: true });
    expect(listSuppliersWithFeeds(db)).toEqual([]);
  });

  it('links to existing favorites ignoring case and accents, using their spelling', () => {
    const supplier = createSupplier(db, 'Sierra de los Santos SCA');
    const feed = addFeed(db, supplier.id, 'Pienso Cordero Eco S/P');
    const saved = saveEntry(
      db,
      entry({ supplierName: 'sierra de los santos sca', feedName: 'PIENSO CORDERO ECO S/P' }),
    );
    expect(saved).toMatchObject({
      supplierId: supplier.id,
      supplierName: 'Sierra de los Santos SCA',
      feedId: feed.id,
      feedName: 'Pienso Cordero Eco S/P',
    });
  });

  it('keeps the entry text when favorites are renamed or deleted', () => {
    const saved = saveEntry(db, entry(), { saveSupplier: true, saveFeed: true });
    const supplierId = saved.supplierId!;

    renameSupplier(db, supplierId, 'Mezclas del Valle SL');
    renameFeed(db, saved.feedId!, 'Cerdos cebo');
    expect(getEntry(db, saved.id)).toMatchObject({
      supplierName: 'Mezclas del Valle',
      feedName: 'Cerdos crecimiento',
    });

    deleteSupplier(db, supplierId);
    expect(getEntry(db, saved.id)).toMatchObject({
      supplierName: 'Mezclas del Valle',
      supplierId: null,
      feedName: 'Cerdos crecimiento',
      feedId: null,
    });
  });

  it('rejects a non-positive quantity at database level', () => {
    expect(() => saveEntry(db, entry({ quantity: 0 }))).toThrow();
  });
});

describe('favorites', () => {
  it('rejects duplicate names ignoring case, accents and spaces', () => {
    const supplier = createSupplier(db, '  Mezclas   del Valle ');
    expect(supplier.name).toBe('Mezclas del Valle');
    expect(() => createSupplier(db, 'mezclas del valle')).toThrow(DuplicateNameError);

    addFeed(db, supplier.id, 'Alfalfa en rama');
    expect(() => addFeed(db, supplier.id, 'ALFALFA EN RAMA')).toThrow(DuplicateNameError);

    const other = createSupplier(db, 'Otro proveedor');
    expect(() => addFeed(db, other.id, 'Alfalfa en rama')).not.toThrow();
  });

  it('allows renaming to the same name with different case', () => {
    const supplier = createSupplier(db, 'mezclas del valle');
    expect(renameSupplier(db, supplier.id, 'Mezclas del Valle').name).toBe('Mezclas del Valle');
  });

  it('lists suppliers and feeds alphabetically', () => {
    const b = createSupplier(db, 'Sierra de los Santos SCA');
    const a = createSupplier(db, 'mezclas del Valle');
    addFeed(db, a.id, 'Cerdos preamontanera');
    addFeed(db, a.id, 'alfalfa en rama');
    addFeed(db, b.id, 'Pienso Cordero Eco S/P');

    const list = listSuppliersWithFeeds(db);
    expect(list.map((s) => s.name)).toEqual(['mezclas del Valle', 'Sierra de los Santos SCA']);
    expect(list[0].feeds.map((f) => f.name)).toEqual(['alfalfa en rama', 'Cerdos preamontanera']);
  });

  it('deletes feeds and cascades supplier deletion to its feeds', () => {
    const supplier = createSupplier(db, 'Mezclas del Valle');
    const feed = addFeed(db, supplier.id, 'Cerdos crecimiento');
    addFeed(db, supplier.id, 'Alfalfa en rama');

    deleteFeed(db, feed.id);
    expect(getSupplierWithFeeds(db, supplier.id)?.feeds.map((f) => f.name)).toEqual(['Alfalfa en rama']);

    deleteSupplier(db, supplier.id);
    expect(getSupplierWithFeeds(db, supplier.id)).toBeUndefined();
    expect(listSuppliersWithFeeds(db)).toEqual([]);
  });
});
