import { eq, sql } from 'drizzle-orm';

import type { SyncDatabase } from '@/core/db/types';
import { nameKey, normalizeName } from '@/core/text';

import { cleaningProducts, type CleaningProduct } from './schema';

export type ProductInput = {
  name: string;
  defaultWaitingDays: number;
  defaultPlace: string | null;
};

/** Thrown when a product with the same name already exists. */
export class DuplicateProductError extends Error {
  constructor(name: string) {
    super(`Ya existe "${name}"`);
    this.name = 'DuplicateProductError';
  }
}

const touch = { updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` };

/** Favorite products by name. */
export function listProducts(db: SyncDatabase): CleaningProduct[] {
  return db
    .select()
    .from(cleaningProducts)
    .orderBy(sql`${cleaningProducts.name} collate nocase`)
    .all();
}

export function getProduct(db: SyncDatabase, id: number): CleaningProduct | undefined {
  return db.select().from(cleaningProducts).where(eq(cleaningProducts.id, id)).get();
}

/** The favorite with this name, ignoring case, accents and extra spaces. */
export function findProductByName(db: SyncDatabase, name: string): CleaningProduct | undefined {
  const key = nameKey(name);
  if (!key) return undefined;
  return db.select().from(cleaningProducts).where(eq(cleaningProducts.nameKey, key)).get();
}

/**
 * Creates (no `id`) or updates a favorite product. Records keep the values
 * they were saved with.
 */
export function saveProduct(db: SyncDatabase, input: ProductInput, id?: number): CleaningProduct {
  const name = normalizeName(input.name);
  if (!name) throw new Error('Name is required');
  const existing = findProductByName(db, name);
  if (existing && existing.id !== id) throw new DuplicateProductError(name);
  const values = {
    name,
    nameKey: nameKey(name),
    defaultWaitingDays: input.defaultWaitingDays,
    defaultPlace: input.defaultPlace ? normalizeName(input.defaultPlace) || null : null,
  };
  if (id === undefined) {
    return db.insert(cleaningProducts).values(values).returning().get();
  }
  const updated: CleaningProduct | undefined = db
    .update(cleaningProducts)
    .set({ ...values, ...touch })
    .where(eq(cleaningProducts.id, id))
    .returning()
    .get();
  if (!updated) throw new Error(`Product ${id} not found`);
  return updated;
}

/** Records keep their product text; their link becomes null. */
export function deleteProduct(db: SyncDatabase, id: number): void {
  db.delete(cleaningProducts).where(eq(cleaningProducts.id, id)).run();
}
