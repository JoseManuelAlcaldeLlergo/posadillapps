import { and, asc, eq, sql } from 'drizzle-orm';

import type { SyncDatabase } from '@/core/db/types';

import { normalizePlate, plateKey } from '../vehicle-entries';
import { nameKey, normalizeName } from './names';
import {
  supplierFeeds,
  suppliers,
  supplierTrucks,
  type Supplier,
  type SupplierFeed,
  type SupplierTruck,
} from './schema';

/** A favorite supplier with its usual feeds and trucks. */
export type SupplierWithFeeds = Supplier & { feeds: SupplierFeed[]; trucks: SupplierTruck[] };

/** Thrown when a supplier, feed or truck with the same name or plate already exists. */
export class DuplicateNameError extends Error {
  constructor(name: string) {
    super(`Ya existe "${name}"`);
    this.name = 'DuplicateNameError';
  }
}

const byName = sql`${suppliers.name} collate nocase`;
const feedByName = sql`${supplierFeeds.name} collate nocase`;
const truckByPlate = asc(supplierTrucks.plateKey);

export function listSuppliersWithFeeds(db: SyncDatabase): SupplierWithFeeds[] {
  const supplierRows: Supplier[] = db.select().from(suppliers).orderBy(asc(byName)).all();
  const feedRows: SupplierFeed[] = db.select().from(supplierFeeds).orderBy(asc(feedByName)).all();
  const truckRows: SupplierTruck[] = db.select().from(supplierTrucks).orderBy(truckByPlate).all();
  return supplierRows.map((supplier) => ({
    ...supplier,
    feeds: feedRows.filter((feed) => feed.supplierId === supplier.id),
    trucks: truckRows.filter((truck) => truck.supplierId === supplier.id),
  }));
}

export function getSupplierWithFeeds(db: SyncDatabase, id: number): SupplierWithFeeds | undefined {
  const supplier: Supplier | undefined = db.select().from(suppliers).where(eq(suppliers.id, id)).get();
  if (!supplier) return undefined;
  return { ...supplier, feeds: listFeeds(db, id), trucks: listTrucks(db, id) };
}

export function findSupplierByName(db: SyncDatabase, name: string): Supplier | undefined {
  return db.select().from(suppliers).where(eq(suppliers.nameKey, nameKey(name))).get();
}

export function createSupplier(db: SyncDatabase, name: string): Supplier {
  const clean = requireName(name);
  if (findSupplierByName(db, clean)) throw new DuplicateNameError(clean);
  return db.insert(suppliers).values({ name: clean, nameKey: nameKey(clean) }).returning().get();
}

/** Renames the favorite only; entries keep the name they were saved with. */
export function renameSupplier(db: SyncDatabase, id: number, name: string): Supplier {
  const clean = requireName(name);
  const existing = findSupplierByName(db, clean);
  if (existing && existing.id !== id) throw new DuplicateNameError(clean);
  return db
    .update(suppliers)
    .set({ name: clean, nameKey: nameKey(clean) })
    .where(eq(suppliers.id, id))
    .returning()
    .get();
}

/** Deletes the supplier, its feeds and trucks. Entries keep their text; their links become null. */
export function deleteSupplier(db: SyncDatabase, id: number): void {
  db.delete(suppliers).where(eq(suppliers.id, id)).run();
}

export function listFeeds(db: SyncDatabase, supplierId: number): SupplierFeed[] {
  return db
    .select()
    .from(supplierFeeds)
    .where(eq(supplierFeeds.supplierId, supplierId))
    .orderBy(asc(feedByName))
    .all();
}

export function findFeedByName(
  db: SyncDatabase,
  supplierId: number,
  name: string,
): SupplierFeed | undefined {
  return db
    .select()
    .from(supplierFeeds)
    .where(and(eq(supplierFeeds.supplierId, supplierId), eq(supplierFeeds.nameKey, nameKey(name))))
    .get();
}

export function addFeed(db: SyncDatabase, supplierId: number, name: string): SupplierFeed {
  const clean = requireName(name);
  if (findFeedByName(db, supplierId, clean)) throw new DuplicateNameError(clean);
  return db
    .insert(supplierFeeds)
    .values({ supplierId, name: clean, nameKey: nameKey(clean) })
    .returning()
    .get();
}

/** Renames the favorite only; entries keep the name they were saved with. */
export function renameFeed(db: SyncDatabase, id: number, name: string): SupplierFeed {
  const clean = requireName(name);
  const feed: SupplierFeed | undefined = db.select().from(supplierFeeds).where(eq(supplierFeeds.id, id)).get();
  if (!feed) throw new Error(`Feed ${id} not found`);
  const existing = findFeedByName(db, feed.supplierId, clean);
  if (existing && existing.id !== id) throw new DuplicateNameError(clean);
  return db
    .update(supplierFeeds)
    .set({ name: clean, nameKey: nameKey(clean) })
    .where(eq(supplierFeeds.id, id))
    .returning()
    .get();
}

export function deleteFeed(db: SyncDatabase, id: number): void {
  db.delete(supplierFeeds).where(eq(supplierFeeds.id, id)).run();
}

export function listTrucks(db: SyncDatabase, supplierId: number): SupplierTruck[] {
  return db
    .select()
    .from(supplierTrucks)
    .where(eq(supplierTrucks.supplierId, supplierId))
    .orderBy(truckByPlate)
    .all();
}

/** The supplier's truck with this plate, ignoring case, spaces and hyphens. */
export function findTruckByPlate(
  db: SyncDatabase,
  supplierId: number,
  plate: string,
): SupplierTruck | undefined {
  return db
    .select()
    .from(supplierTrucks)
    .where(and(eq(supplierTrucks.supplierId, supplierId), eq(supplierTrucks.plateKey, plateKey(plate))))
    .get();
}

export function addTruck(db: SyncDatabase, supplierId: number, plate: string): SupplierTruck {
  const clean = normalizePlate(plate);
  if (!clean) throw new Error('Plate is required');
  if (findTruckByPlate(db, supplierId, clean)) throw new DuplicateNameError(clean);
  return db
    .insert(supplierTrucks)
    .values({ supplierId, plate: clean, plateKey: plateKey(clean) })
    .returning()
    .get();
}

/** Entries keep the plate they were saved with; their link becomes null. */
export function deleteTruck(db: SyncDatabase, id: number): void {
  db.delete(supplierTrucks).where(eq(supplierTrucks.id, id)).run();
}

function requireName(name: string): string {
  const clean = normalizeName(name);
  if (!clean) throw new Error('Name is required');
  return clean;
}
