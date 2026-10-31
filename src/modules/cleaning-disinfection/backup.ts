import { asc } from 'drizzle-orm';

import { BackupFormatError, defineModuleBackup } from '@/core/backup/types';
import {
  optionalInteger,
  optionalString,
  requireArray,
  requireBoolean,
  requireInteger,
  requireIsoDate,
  requireRecord,
  requireString,
  requireUniqueIds,
} from '@/core/backup/validate';
import type { SyncDatabase } from '@/core/db/types';

import {
  cleaningApplications,
  cleaningProducts,
  cleaningRegulars,
  type CleaningApplication,
  type CleaningProduct,
  type CleaningRegular,
} from './schema';

export type CleaningDisinfectionBackupData = {
  products: CleaningProduct[];
  regulars: CleaningRegular[];
  applications: CleaningApplication[];
};

const BATCH_SIZE = 500;

function requireWaitingDays(value: unknown, path: string): number {
  const days = requireInteger(value, path);
  if (days < 0) throw new BackupFormatError(`Dato no válido en ${path}: no puede ser negativo`);
  return days;
}

function optionalIsoDate(value: unknown, path: string): string | null {
  return value === null || value === undefined ? null : requireIsoDate(value, path);
}

function parseProduct(value: unknown, path: string): CleaningProduct {
  const row = requireRecord(value, path);
  return {
    id: requireInteger(row.id, `${path}.id`),
    name: requireString(row.name, `${path}.name`),
    nameKey: requireString(row.nameKey, `${path}.nameKey`),
    defaultWaitingDays: requireWaitingDays(row.defaultWaitingDays, `${path}.defaultWaitingDays`),
    defaultPlace: optionalString(row.defaultPlace, `${path}.defaultPlace`),
    createdAt: requireString(row.createdAt, `${path}.createdAt`),
    updatedAt: requireString(row.updatedAt, `${path}.updatedAt`),
  };
}

/** Fields shared by regular applications and applications. */
function parseRecordFields(row: Record<string, unknown>, path: string) {
  return {
    id: requireInteger(row.id, `${path}.id`),
    farmCode: requireString(row.farmCode, `${path}.farmCode`),
    productiveUnit: requireString(row.productiveUnit, `${path}.productiveUnit`),
    productName: requireString(row.productName, `${path}.productName`),
    productKey: requireString(row.productKey, `${path}.productKey`),
    productId: optionalInteger(row.productId, `${path}.productId`),
    place: requireString(row.place, `${path}.place`),
    waitingDays: requireWaitingDays(row.waitingDays, `${path}.waitingDays`),
    reviewDate: optionalIsoDate(row.reviewDate, `${path}.reviewDate`),
    createdAt: requireString(row.createdAt, `${path}.createdAt`),
    updatedAt: requireString(row.updatedAt, `${path}.updatedAt`),
  };
}

function parseRegular(value: unknown, path: string): CleaningRegular {
  const row = requireRecord(value, path);
  return {
    ...parseRecordFields(row, path),
    frequency: requireString(row.frequency, `${path}.frequency`),
    active: requireBoolean(row.active, `${path}.active`),
  };
}

function parseApplication(value: unknown, path: string): CleaningApplication {
  const row = requireRecord(value, path);
  return { ...parseRecordFields(row, path), date: requireIsoDate(row.date, `${path}.date`) };
}

function requireProduct(id: number | null, ids: Set<number>, path: string): void {
  if (id !== null && !ids.has(id)) {
    throw new BackupFormatError(`Dato no válido en ${path}: no existe el producto con id ${id}`);
  }
}

function insertInBatches<T>(rows: T[], insert: (batch: T[]) => void): void {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) insert(rows.slice(i, i + BATCH_SIZE));
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export const cleaningDisinfectionBackup = defineModuleBackup<CleaningDisinfectionBackupData>({
  version: 1,

  export: (db: SyncDatabase) => ({
    products: db.select().from(cleaningProducts).orderBy(asc(cleaningProducts.id)).all(),
    regulars: db.select().from(cleaningRegulars).orderBy(asc(cleaningRegulars.id)).all(),
    applications: db.select().from(cleaningApplications).orderBy(asc(cleaningApplications.id)).all(),
  }),

  parse: (data) => {
    if (data === undefined) return { products: [], regulars: [], applications: [] };
    const root = requireRecord(data, 'cleaning-disinfection');
    const parsed: CleaningDisinfectionBackupData = {
      products: requireArray(root.products, 'products').map((row, i) =>
        parseProduct(row, `products[${i}]`),
      ),
      regulars: requireArray(root.regulars, 'regulars').map((row, i) =>
        parseRegular(row, `regulars[${i}]`),
      ),
      applications: requireArray(root.applications, 'applications').map((row, i) =>
        parseApplication(row, `applications[${i}]`),
      ),
    };
    requireUniqueIds(parsed.products, 'products');
    requireUniqueIds(parsed.regulars, 'regulars');
    requireUniqueIds(parsed.applications, 'applications');

    const productIds = new Set(parsed.products.map((p) => p.id));
    parsed.regulars.forEach((r, i) => requireProduct(r.productId, productIds, `regulars[${i}].productId`));
    parsed.applications.forEach((a, i) =>
      requireProduct(a.productId, productIds, `applications[${i}].productId`),
    );
    return parsed;
  },

  clear: (tx) => {
    tx.delete(cleaningApplications).run();
    tx.delete(cleaningRegulars).run();
    tx.delete(cleaningProducts).run();
  },

  restore: (tx, data) => {
    insertInBatches(data.products, (batch) => tx.insert(cleaningProducts).values(batch).run());
    insertInBatches(data.regulars, (batch) => tx.insert(cleaningRegulars).values(batch).run());
    insertInBatches(data.applications, (batch) => tx.insert(cleaningApplications).values(batch).run());
  },

  summary: (data) =>
    [
      plural(data.applications.length, 'aplicación', 'aplicaciones'),
      plural(data.regulars.length, 'aplicación habitual', 'aplicaciones habituales'),
      plural(data.products.length, 'producto', 'productos'),
    ].join(', '),
});
