/**
 * @jest-environment node
 */
import { createBackup, parseBackupFile, restoreBackup, serializeBackup } from '@/core/backup/backup';
import { createTestDb } from '@/core/db/testing/createTestDb';
import type { SyncDatabase } from '@/core/db/types';

import { feedEntriesBackup, type FeedEntriesBackupData } from '../backup';
import { addFeed, createSupplier, listSuppliersWithFeeds } from '../favoritesRepository';
import { feedEntriesModule } from '../module';
import { listEntries, saveEntry } from '../repository';

const modules = [feedEntriesModule];

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
    },
    { saveSupplier: true, saveFeed: true },
  );
  saveEntry(db, {
    date: '2025-04-30',
    quantity: 1234.5,
    unit: 't',
    supplierName: 'Proveedor puntual',
    feedName: 'Paja',
    invoice: null,
  });
}

function snapshot(db: SyncDatabase) {
  return { entries: listEntries(db), favorites: listSuppliersWithFeeds(db) };
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
    });
    restoreBackup(target.db, contents, modules);

    expect(snapshot(target.db)).toEqual(snapshot(source.db));
    source.close();
    target.close();
  });

  it('summarizes the data in Spanish', () => {
    const { db, close } = createTestDb();
    expect(feedEntriesBackup.summary(feedEntriesBackup.export(db))).toBe(
      '0 entradas, 0 proveedores, 0 piensos habituales',
    );
    seed(db);
    expect(feedEntriesBackup.summary(feedEntriesBackup.export(db))).toBe(
      '2 entradas, 1 proveedor, 2 piensos habituales',
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
      [
        'repeated ids',
        { ...valid, entries: [valid.entries[0], valid.entries[0]] },
        'el id 1 está repetido',
      ],
      ['a missing list', { ...valid, feeds: undefined }, 'feeds: se esperaba una lista'],
    ])('with %s', (_label, data, message) => {
      expect(() => feedEntriesBackup.parse(data, 1)).toThrow(message);
    });

    it('returns empty data when the module is missing from the file', () => {
      expect(feedEntriesBackup.parse(undefined, 1)).toEqual({ suppliers: [], feeds: [], entries: [] });
    });
  });
});
