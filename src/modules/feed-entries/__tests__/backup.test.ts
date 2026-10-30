/**
 * @jest-environment node
 */
import { createBackup, parseBackupFile, restoreBackup, serializeBackup } from '@/core/backup/backup';
import { createTestDb } from '@/core/db/testing/createTestDb';
import type { SyncDatabase } from '@/core/db/types';

import { modules } from '@/modules/registry';
import { listVisits } from '@/modules/vehicle-entries/repository';

import { feedEntriesBackup, type FeedEntriesBackupData } from '../backup';
import { addFeed, createSupplier, listSuppliersWithFeeds } from '../favoritesRepository';
import { listEntries, saveEntry } from '../repository';

function seed(db: SyncDatabase) {
  const valle = createSupplier(db, 'Mezclas del Valle');
  addFeed(db, valle.id, 'Alfalfa en rama');
  saveEntry(
    db,
    {
      date: '2025-03-31',
      quantity: 9340,
      unit: 'kg',
      supplierName: 'Mezclas del Valle',
      feedName: 'Cerdos crecimiento',
      invoice: 'F2000 525',
      truckPlate: '1234 bcd',
    },
    { saveSupplier: true, saveFeed: true, saveTruck: true },
  );
  saveEntry(db, {
    date: '2025-04-30',
    quantity: 1234.5,
    unit: 't',
    supplierName: 'Proveedor puntual',
    feedName: 'Paja',
    invoice: null,
    truckPlate: null,
  });
}

function snapshot(db: SyncDatabase) {
  return {
    entries: listEntries(db),
    favorites: listSuppliersWithFeeds(db),
    visits: listVisits(db),
  };
}

describe('feed-entries backup', () => {
  it('restores identical rows, ids and links into an empty database', () => {
    const source = createTestDb();
    seed(source.db);
    const text = serializeBackup(createBackup(source.db, modules));

    const target = createTestDb();
    restoreBackup(target.db, parseBackupFile(text, modules), modules);

    expect(snapshot(target.db)).toEqual(snapshot(source.db));
    const [, linked] = listEntries(target.db);
    expect(linked.supplierId).not.toBeNull();
    expect(linked.feedId).not.toBeNull();
    expect(linked.truckId).not.toBeNull();
    // Restored before the vehicles module, which owns the visit it points to.
    expect(linked.vehicleVisitId).toBe(listVisits(target.db)[0].id);

    // New rows continue after the restored ids.
    const next = createSupplier(target.db, 'Otro');
    expect(next.id).toBeGreaterThan(Math.max(...listSuppliersWithFeeds(source.db).map((s) => s.id)));
    source.close();
    target.close();
  });

  it('replaces existing data', () => {
    const source = createTestDb();
    seed(source.db);
    const contents = parseBackupFile(serializeBackup(createBackup(source.db, modules)), modules);

    const target = createTestDb();
    createSupplier(target.db, 'Sierra de los Santos SCA');
    saveEntry(target.db, {
      date: '2026-01-01',
      quantity: 1,
      unit: 'kg',
      supplierName: 'Sierra de los Santos SCA',
      feedName: 'Pienso Cordero Eco S/P',
      invoice: null,
      truckPlate: null,
    });
    restoreBackup(target.db, contents, modules);

    expect(snapshot(target.db)).toEqual(snapshot(source.db));
    source.close();
    target.close();
  });

  it('summarizes the data in Spanish', () => {
    const { db, close } = createTestDb();
    expect(feedEntriesBackup.summary(feedEntriesBackup.export(db))).toBe(
      '0 entradas, 0 proveedores, 0 piensos habituales, 0 camiones habituales',
    );
    seed(db);
    expect(feedEntriesBackup.summary(feedEntriesBackup.export(db))).toBe(
      '2 entradas, 1 proveedor, 2 piensos habituales, 1 camión habitual',
    );
    close();
  });

  describe('parse rejects invalid data', () => {
    // Built while collecting tests: `it.each` tables are evaluated before hooks run.
    const valid: FeedEntriesBackupData = (() => {
      const { db, close } = createTestDb();
      seed(db);
      const data = JSON.parse(JSON.stringify(feedEntriesBackup.export(db)));
      close();
      return data;
    })();

    function withEntry(change: Record<string, unknown>) {
      return { ...valid, entries: [{ ...valid.entries[0], ...change }, ...valid.entries.slice(1)] };
    }

    it.each([
      ['a bad date', withEntry({ date: '31-03-2025' }), 'entries[0].date'],
      ['an unknown unit', withEntry({ unit: 'sacos' }), 'unidad desconocida «sacos»'],
      ['a zero quantity', withEntry({ quantity: 0 }), 'entries[0].quantity: debe ser mayor que 0'],
      ['a missing supplier', withEntry({ supplierId: 999 }), 'no existe el proveedor con id 999'],
      ['a missing feed', withEntry({ feedId: 999 }), 'no existe el pienso con id 999'],
      ['a missing truck', withEntry({ truckId: 999 }), 'no existe el camión con id 999'],
      [
        'a truck of a missing supplier',
        { ...valid, trucks: [{ ...valid.trucks[0], supplierId: 999 }] },
        'trucks[0].supplierId: no existe el proveedor con id 999',
      ],
      [
        'repeated ids',
        { ...valid, entries: [valid.entries[0], valid.entries[0]] },
        'el id 1 está repetido',
      ],
      ['a missing list', { ...valid, feeds: undefined }, 'feeds: se esperaba una lista'],
    ])('with %s', (_label, data, message) => {
      expect(() => feedEntriesBackup.parse(data, 2)).toThrow(message);
    });

    it('returns empty data when the module is missing from the file', () => {
      expect(feedEntriesBackup.parse(undefined, 2)).toEqual({
        suppliers: [],
        feeds: [],
        trucks: [],
        entries: [],
      });
    });

    it('reads version 1 files without trucks or vehicle visits', () => {
      const { trucks: _trucks, ...v1 } = valid;
      const entries = v1.entries.map(
        ({ truckPlate: _plate, truckId: _truck, vehicleVisitId: _visit, ...entry }) => entry,
      );
      const parsed = feedEntriesBackup.parse({ ...v1, entries }, 1);
      expect(parsed.trucks).toEqual([]);
      expect(parsed.entries.map((e) => [e.truckPlate, e.truckId, e.vehicleVisitId])).toEqual([
        [null, null, null],
        [null, null, null],
      ]);
    });
  });
});
