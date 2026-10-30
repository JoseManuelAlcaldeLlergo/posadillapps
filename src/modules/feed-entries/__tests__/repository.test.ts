/**
 * @jest-environment node
 */
import { sql } from 'drizzle-orm';

import { createTestDb } from '@/core/db/testing/createTestDb';
import type { SyncDatabase } from '@/core/db/types';
import { getVisit, listVisits, saveVisit } from '@/modules/vehicle-entries/repository';

import {
  addFeed,
  addTruck,
  createSupplier,
  deleteFeed,
  deleteSupplier,
  deleteTruck,
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
  FEED_VISIT_SOURCE,
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
    truckPlate: null,
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

describe('truck favorites', () => {
  it('rejects duplicate plates per supplier ignoring spaces and hyphens', () => {
    const supplier = createSupplier(db, 'Mezclas del Valle');
    expect(addTruck(db, supplier.id, ' co-46336 ve').plate).toBe('CO-46336 VE');
    expect(() => addTruck(db, supplier.id, 'CO46336VE')).toThrow(DuplicateNameError);
    const other = createSupplier(db, 'Otro');
    expect(() => addTruck(db, other.id, 'CO-46336-VE')).not.toThrow();
    expect(getSupplierWithFeeds(db, supplier.id)?.trucks.map((t) => t.plate)).toEqual(['CO-46336 VE']);
  });

  it('links entries to the truck and keeps the plate when it is deleted', () => {
    const supplier = createSupplier(db, 'Mezclas del Valle');
    const truck = addTruck(db, supplier.id, '1234 BCD');
    const saved = saveEntry(db, entry({ truckPlate: '1234-bcd' }));
    expect(saved).toMatchObject({ truckId: truck.id, truckPlate: '1234 BCD' });

    deleteTruck(db, truck.id);
    expect(getEntry(db, saved.id)).toMatchObject({ truckId: null, truckPlate: '1234 BCD' });
  });

  it('saves a new truck only when asked', () => {
    saveEntry(db, entry({ truckPlate: '1234 BCD' }), { saveSupplier: true, saveFeed: true });
    expect(listSuppliersWithFeeds(db)[0].trucks).toEqual([]);
    saveEntry(db, entry({ truckPlate: '1234 BCD' }), {
      saveSupplier: true,
      saveFeed: true,
      saveTruck: true,
    });
    expect(listSuppliersWithFeeds(db)[0].trucks.map((t) => t.plate)).toEqual(['1234 BCD']);
  });

  it('cascades supplier deletion to its trucks', () => {
    const supplier = createSupplier(db, 'Mezclas del Valle');
    addTruck(db, supplier.id, '1234 BCD');
    deleteSupplier(db, supplier.id);
    expect(db.all(sql`select * from feed_supplier_trucks`)).toEqual([]);
  });
});

describe('automatic vehicle visits', () => {
  it('creates a feed delivery visit when the entry has a truck plate', () => {
    const saved = saveEntry(db, entry({ date: '2025-03-31', truckPlate: '1234 bcd' }));
    const visit = getVisit(db, saved.vehicleVisitId!);
    expect(visit).toMatchObject({
      date: '2025-03-31',
      plate: '1234 BCD',
      reason: 'Transporte de pienso',
      vehicleType: 'feed_truck',
      source: FEED_VISIT_SOURCE,
    });
  });

  it('creates no visit without a plate', () => {
    const saved = saveEntry(db, entry({ truckPlate: null }));
    expect(saved.vehicleVisitId).toBeNull();
    expect(listVisits(db)).toEqual([]);
  });

  it('links two entries of the same truck and day to a single visit', () => {
    const a = saveEntry(db, entry({ feedName: 'Cerdos crecimiento', truckPlate: '1234 BCD' }));
    const b = saveEntry(db, entry({ feedName: 'Alfalfa en rama', truckPlate: '1234-bcd' }));
    expect(b.vehicleVisitId).toBe(a.vehicleVisitId);
    expect(listVisits(db)).toHaveLength(1);
  });

  it('does not reuse a manual visit of the same truck and day', () => {
    const manual = saveVisit(db, {
      date: '2025-03-31',
      plate: '1234 BCD',
      reason: 'Transporte de pienso',
      vehicleType: 'feed_truck',
    });
    const saved = saveEntry(db, entry({ truckPlate: '1234 BCD' }));
    expect(saved.vehicleVisitId).not.toBe(manual.id);
  });

  it('reassigns the visit when the date changes and deletes the one left empty', () => {
    const a = saveEntry(db, entry({ date: '2025-03-31', truckPlate: '1234 BCD' }));
    const oldVisit = a.vehicleVisitId!;

    const moved = saveEntry(db, entry({ date: '2025-04-01', truckPlate: '1234 BCD' }), undefined, a.id);
    expect(moved.vehicleVisitId).not.toBe(oldVisit);
    expect(getVisit(db, oldVisit)).toBeUndefined();
    expect(getVisit(db, moved.vehicleVisitId!)?.date).toBe('2025-04-01');
  });

  it('keeps the old visit while other entries still use it', () => {
    const a = saveEntry(db, entry({ truckPlate: '1234 BCD' }));
    const b = saveEntry(db, entry({ feedName: 'Alfalfa en rama', truckPlate: '1234 BCD' }));
    const shared = a.vehicleVisitId!;

    const changed = saveEntry(db, entry({ truckPlate: '9999 ZZZ' }), undefined, a.id);
    expect(changed.vehicleVisitId).not.toBe(shared);
    expect(getVisit(db, shared)).toBeDefined();
    expect(getEntry(db, b.id)?.vehicleVisitId).toBe(shared);
  });

  it('removes the visit when the plate is cleared', () => {
    const a = saveEntry(db, entry({ truckPlate: '1234 BCD' }));
    const cleared = saveEntry(db, entry({ truckPlate: null }), undefined, a.id);
    expect(cleared.vehicleVisitId).toBeNull();
    expect(listVisits(db)).toEqual([]);
  });

  it('deletes the visit with its last entry', () => {
    const a = saveEntry(db, entry({ truckPlate: '1234 BCD' }));
    const b = saveEntry(db, entry({ feedName: 'Alfalfa en rama', truckPlate: '1234 BCD' }));
    deleteEntry(db, a.id);
    expect(listVisits(db)).toHaveLength(1);
    deleteEntry(db, b.id);
    expect(listVisits(db)).toEqual([]);
  });

  it('keeps reason and type edited in the vehicles module', () => {
    const a = saveEntry(db, entry({ truckPlate: '1234 BCD' }));
    const visit = getVisit(db, a.vehicleVisitId!)!;
    saveVisit(
      db,
      { date: visit.date, plate: visit.plate, reason: 'Transporte de animales', vehicleType: 'livestock_truck' },
      visit.id,
    );
    const b = saveEntry(db, entry({ feedName: 'Alfalfa en rama', truckPlate: '1234 BCD' }));
    expect(getVisit(db, b.vehicleVisitId!)).toMatchObject({
      reason: 'Transporte de animales',
      vehicleType: 'livestock_truck',
    });
  });

  it('lists the entries of a visit', () => {
    const a = saveEntry(db, entry({ invoice: 'A', truckPlate: '1234 BCD' }));
    saveEntry(db, entry({ invoice: 'B', truckPlate: '1234 BCD' }));
    saveEntry(db, entry({ invoice: 'C', truckPlate: null }));
    expect(listEntries(db, { vehicleVisitId: a.vehicleVisitId }).map((e) => e.invoice)).toEqual([
      'B',
      'A',
    ]);
  });

  it('rolls back the visit if the entry cannot be saved', () => {
    expect(() => saveEntry(db, entry({ quantity: 0, truckPlate: '1234 BCD' }))).toThrow();
    expect(listVisits(db)).toEqual([]);
  });
});
