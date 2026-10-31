import { asc, eq, sql } from 'drizzle-orm';

import type { SyncDatabase } from '../db/types';
import { nameKey, normalizeName } from '../text';
import { farmSettings, productiveUnits, type ProductiveUnit } from './schema';

const SETTINGS_ID = 1;

/** Thrown when a productive unit with the same name already exists. */
export class DuplicateNameError extends Error {
  constructor(name: string) {
    super(`Ya existe "${name}"`);
    this.name = 'DuplicateNameError';
  }
}

/** The farm code, or null if it has not been set yet. */
export function getFarmCode(db: SyncDatabase): string | null {
  const row: { farmCode: string } | undefined = db
    .select({ farmCode: farmSettings.farmCode })
    .from(farmSettings)
    .where(eq(farmSettings.id, SETTINGS_ID))
    .get();
  return row?.farmCode ?? null;
}

/** Saves the farm code, normalized; an empty code unsets it. Records keep their snapshot. */
export function setFarmCode(db: SyncDatabase, code: string): string | null {
  const clean = normalizeName(code);
  if (!clean) {
    db.delete(farmSettings).run();
    return null;
  }
  db.insert(farmSettings)
    .values({ id: SETTINGS_ID, farmCode: clean })
    .onConflictDoUpdate({
      target: farmSettings.id,
      set: { farmCode: clean, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` },
    })
    .run();
  return clean;
}

/** Productive units in the order chosen by the user. */
export function listProductiveUnits(db: SyncDatabase): ProductiveUnit[] {
  return db
    .select()
    .from(productiveUnits)
    .orderBy(asc(productiveUnits.sortOrder), asc(productiveUnits.id))
    .all();
}

/** Adds a unit at the end of the list. */
export function addProductiveUnit(db: SyncDatabase, name: string): ProductiveUnit {
  const clean = normalizeName(name);
  if (!clean) throw new Error('Name is required');
  const key = nameKey(clean);
  const existing = db.select().from(productiveUnits).where(eq(productiveUnits.nameKey, key)).get();
  if (existing) throw new DuplicateNameError(clean);
  const row: { max: number | null } | undefined = db
    .select({ max: sql<number | null>`max(${productiveUnits.sortOrder})` })
    .from(productiveUnits)
    .get();
  return db
    .insert(productiveUnits)
    .values({ name: clean, nameKey: key, sortOrder: (row?.max ?? -1) + 1 })
    .returning()
    .get();
}

/** Records keep the unit text they were saved with. */
export function deleteProductiveUnit(db: SyncDatabase, id: number): void {
  db.delete(productiveUnits).where(eq(productiveUnits.id, id)).run();
}

/** Swaps the unit with its previous (`-1`) or next (`1`) neighbour. No-op at the ends. */
export function moveProductiveUnit(db: SyncDatabase, id: number, direction: -1 | 1): void {
  db.transaction((tx) => {
    const units = listProductiveUnits(tx);
    const index = units.findIndex((unit) => unit.id === id);
    const other = units[index + direction];
    if (index < 0 || !other) return;
    // Renumber so equal sort orders (e.g. from old data) cannot block the swap.
    const reordered = [...units];
    [reordered[index], reordered[index + direction]] = [other, units[index]];
    reordered.forEach((unit, sortOrder) => {
      tx.update(productiveUnits).set({ sortOrder }).where(eq(productiveUnits.id, unit.id)).run();
    });
  });
}
