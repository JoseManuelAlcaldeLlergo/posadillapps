import { asc } from 'drizzle-orm';

import { BackupFormatError, defineModuleBackup } from '@/core/backup/types';
import {
  optionalInteger,
  optionalString,
  requireArray,
  requireInteger,
  requireIsoDate,
  requireNumber,
  requireRecord,
  requireString,
  requireUniqueIds,
} from '@/core/backup/validate';
import type { SyncDatabase } from '@/core/db/types';

import {
  feedEntries,
  supplierFeeds,
  suppliers,
  supplierTrucks,
  type FeedEntry,
  type Supplier,
  type SupplierFeed,
  type SupplierTruck,
} from './schema';
import { isFeedUnit, type FeedUnit } from './units';

export type FeedEntriesBackupData = {
  suppliers: Supplier[];
  feeds: SupplierFeed[];
  trucks: SupplierTruck[];
  entries: FeedEntry[];
};

const BATCH_SIZE = 500;

function parseSupplier(value: unknown, path: string): Supplier {
  const row = requireRecord(value, path);
  return {
    id: requireInteger(row.id, `${path}.id`),
    name: requireString(row.name, `${path}.name`),
    nameKey: requireString(row.nameKey, `${path}.nameKey`),
    createdAt: requireString(row.createdAt, `${path}.createdAt`),
  };
}

function parseFeed(value: unknown, path: string): SupplierFeed {
  const row = requireRecord(value, path);
  return {
    id: requireInteger(row.id, `${path}.id`),
    supplierId: requireInteger(row.supplierId, `${path}.supplierId`),
    name: requireString(row.name, `${path}.name`),
    nameKey: requireString(row.nameKey, `${path}.nameKey`),
    createdAt: requireString(row.createdAt, `${path}.createdAt`),
  };
}

function parseTruck(value: unknown, path: string): SupplierTruck {
  const row = requireRecord(value, path);
  return {
    id: requireInteger(row.id, `${path}.id`),
    supplierId: requireInteger(row.supplierId, `${path}.supplierId`),
    plate: requireString(row.plate, `${path}.plate`),
    plateKey: requireString(row.plateKey, `${path}.plateKey`),
    createdAt: requireString(row.createdAt, `${path}.createdAt`),
  };
}

/** Version 1 files have no trucks nor vehicle visits: those fields are empty. */
function parseEntry(value: unknown, path: string, version: number): FeedEntry {
  const row = requireRecord(value, path);
  const unit = requireString(row.unit, `${path}.unit`);
  if (!isFeedUnit(unit)) {
    throw new BackupFormatError(`Dato no válido en ${path}.unit: unidad desconocida «${unit}»`);
  }
  const quantity = requireNumber(row.quantity, `${path}.quantity`);
  if (quantity <= 0) {
    throw new BackupFormatError(`Dato no válido en ${path}.quantity: debe ser mayor que 0`);
  }
  return {
    id: requireInteger(row.id, `${path}.id`),
    date: requireIsoDate(row.date, `${path}.date`),
    quantity,
    unit: unit as FeedUnit,
    supplierName: requireString(row.supplierName, `${path}.supplierName`),
    supplierId: optionalInteger(row.supplierId, `${path}.supplierId`),
    feedName: requireString(row.feedName, `${path}.feedName`),
    feedId: optionalInteger(row.feedId, `${path}.feedId`),
    invoice: optionalString(row.invoice, `${path}.invoice`),
    truckPlate: version < 2 ? null : optionalString(row.truckPlate, `${path}.truckPlate`),
    truckId: version < 2 ? null : optionalInteger(row.truckId, `${path}.truckId`),
    // Checked against the vehicles module data when the restore commits.
    vehicleVisitId: version < 2 ? null : optionalInteger(row.vehicleVisitId, `${path}.vehicleVisitId`),
    createdAt: requireString(row.createdAt, `${path}.createdAt`),
    updatedAt: requireString(row.updatedAt, `${path}.updatedAt`),
  };
}

function requireReference(id: number | null, ids: Set<number>, path: string, what: string): void {
  if (id !== null && !ids.has(id)) {
    throw new BackupFormatError(`Dato no válido en ${path}: no existe el ${what} con id ${id}`);
  }
}

function insertInBatches<T>(rows: T[], insert: (batch: T[]) => void): void {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) insert(rows.slice(i, i + BATCH_SIZE));
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export const feedEntriesBackup = defineModuleBackup<FeedEntriesBackupData>({
  version: 2,

  export: (db: SyncDatabase) => ({
    suppliers: db.select().from(suppliers).orderBy(asc(suppliers.id)).all(),
    feeds: db.select().from(supplierFeeds).orderBy(asc(supplierFeeds.id)).all(),
    trucks: db.select().from(supplierTrucks).orderBy(asc(supplierTrucks.id)).all(),
    entries: db.select().from(feedEntries).orderBy(asc(feedEntries.id)).all(),
  }),

  parse: (data, version) => {
    if (data === undefined) return { suppliers: [], feeds: [], trucks: [], entries: [] };
    const root = requireRecord(data, 'feed-entries');
    const parsed: FeedEntriesBackupData = {
      suppliers: requireArray(root.suppliers, 'suppliers').map((row, i) =>
        parseSupplier(row, `suppliers[${i}]`),
      ),
      feeds: requireArray(root.feeds, 'feeds').map((row, i) => parseFeed(row, `feeds[${i}]`)),
      trucks:
        version < 2
          ? []
          : requireArray(root.trucks, 'trucks').map((row, i) => parseTruck(row, `trucks[${i}]`)),
      entries: requireArray(root.entries, 'entries').map((row, i) =>
        parseEntry(row, `entries[${i}]`, version),
      ),
    };

    requireUniqueIds(parsed.suppliers, 'suppliers');
    requireUniqueIds(parsed.feeds, 'feeds');
    requireUniqueIds(parsed.trucks, 'trucks');
    requireUniqueIds(parsed.entries, 'entries');

    const supplierIds = new Set(parsed.suppliers.map((s) => s.id));
    const feedIds = new Set(parsed.feeds.map((f) => f.id));
    const truckIds = new Set(parsed.trucks.map((t) => t.id));
    parsed.feeds.forEach((feed, i) =>
      requireReference(feed.supplierId, supplierIds, `feeds[${i}].supplierId`, 'proveedor'),
    );
    parsed.trucks.forEach((truck, i) =>
      requireReference(truck.supplierId, supplierIds, `trucks[${i}].supplierId`, 'proveedor'),
    );
    parsed.entries.forEach((entry, i) => {
      requireReference(entry.supplierId, supplierIds, `entries[${i}].supplierId`, 'proveedor');
      requireReference(entry.feedId, feedIds, `entries[${i}].feedId`, 'pienso');
      requireReference(entry.truckId, truckIds, `entries[${i}].truckId`, 'camión');
    });
    return parsed;
  },

  clear: (tx) => {
    tx.delete(feedEntries).run();
    tx.delete(supplierFeeds).run();
    tx.delete(supplierTrucks).run();
    tx.delete(suppliers).run();
  },

  restore: (tx, data) => {
    insertInBatches(data.suppliers, (batch) => tx.insert(suppliers).values(batch).run());
    insertInBatches(data.feeds, (batch) => tx.insert(supplierFeeds).values(batch).run());
    insertInBatches(data.trucks, (batch) => tx.insert(supplierTrucks).values(batch).run());
    insertInBatches(data.entries, (batch) => tx.insert(feedEntries).values(batch).run());
  },

  summary: (data) =>
    [
      plural(data.entries.length, 'entrada', 'entradas'),
      plural(data.suppliers.length, 'proveedor', 'proveedores'),
      plural(data.feeds.length, 'pienso habitual', 'piensos habituales'),
      plural(data.trucks.length, 'camión habitual', 'camiones habituales'),
    ].join(', '),
});
