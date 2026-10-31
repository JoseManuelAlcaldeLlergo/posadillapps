import { and, asc, desc, eq, gte, lte, ne, sql, type SQL } from 'drizzle-orm';

import type { DateRange } from '@/core/dates';
import type { SyncDatabase } from '@/core/db/types';
import type { YearRange } from '@/core/export/types';
import { mergeSuggestions } from '@/core/text';
import { newYearRows, previewYearRows, type YearPreview } from '@/core/yearGeneration';

import { plateKey } from '../vehicle-entries';
import {
  cleaningVehicles,
  oneOffCleanings,
  periodicCleanings,
  type CleaningVehicle,
  type OneOffCleaning,
  type PeriodicCleaning,
} from './schema';
import { defaultReviewText, PRESET_FREQUENCIES, PRESET_VEHICLE_TYPES } from './suggestions';

/** Fields shared by every cleaning, already validated (plate normalized). */
export type CleaningFields = {
  plate: string;
  productName: string;
  vehicleType: string;
  /** Null when empty; exported as `—`. */
  reviewText: string | null;
};

export type OneOffInput = CleaningFields & { date: string };

export type PeriodicFields = CleaningFields & { frequency: string };

export type PeriodicInput = PeriodicFields & { year: number };

export type VehicleInput = {
  plate: string;
  frequency: string;
  productName: string;
  vehicleType: string;
  active: boolean;
};

/** A row proposed when generating a year, before the user reviews it. */
export type GeneratedRow = PeriodicFields & { vehicleId: number };

export type CleaningFilters = {
  /** Inclusive ISO dates; periodic cleanings match by year. Omitted means open-ended. */
  from?: string | null;
  to?: string | null;
  /** Exact plate, ignoring case, spaces and hyphens. */
  plate?: string | null;
};

/** Thrown when another vehicle has the same plate. */
export class DuplicateVehicleError extends Error {
  constructor(plate: string) {
    super(`Ya existe el vehículo ${plate}`);
    this.name = 'DuplicateVehicleError';
  }
}

/** Thrown when the vehicle already has a periodic cleaning in that year. */
export class DuplicatePeriodicError extends Error {
  constructor(plate: string, year: number) {
    super(`${plate} ya tiene una limpieza periódica en ${year}`);
    this.name = 'DuplicatePeriodicError';
  }
}

const touch = { updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` };

/** Years an inclusive date range touches: 2023-07-01…2024-06-30 → 2023–2024. */
export function yearsOfRange(range: DateRange): YearRange {
  return { fromYear: Number(range.from.slice(0, 4)), toYear: Number(range.to.slice(0, 4)) };
}

// --- Vehicles of periodic cleaning ---

/** Active first, then by plate. */
export function listVehicles(db: SyncDatabase): CleaningVehicle[] {
  return db
    .select()
    .from(cleaningVehicles)
    .orderBy(desc(cleaningVehicles.active), asc(cleaningVehicles.plateKey))
    .all();
}

export function listActiveVehicles(db: SyncDatabase): CleaningVehicle[] {
  return db
    .select()
    .from(cleaningVehicles)
    .where(eq(cleaningVehicles.active, true))
    .orderBy(asc(cleaningVehicles.plateKey))
    .all();
}

export function getVehicle(db: SyncDatabase, id: number): CleaningVehicle | undefined {
  return db.select().from(cleaningVehicles).where(eq(cleaningVehicles.id, id)).get();
}

/** Creates (no `id`) or updates a vehicle. Cleanings already saved keep their texts. */
export function saveVehicle(db: SyncDatabase, input: VehicleInput, id?: number): CleaningVehicle {
  const key = plateKey(input.plate);
  const existing = db.select().from(cleaningVehicles).where(eq(cleaningVehicles.plateKey, key)).get();
  if (existing && existing.id !== id) throw new DuplicateVehicleError(input.plate);
  const values = { ...input, plateKey: key };
  if (id === undefined) return db.insert(cleaningVehicles).values(values).returning().get();
  const updated: CleaningVehicle | undefined = db
    .update(cleaningVehicles)
    .set({ ...values, ...touch })
    .where(eq(cleaningVehicles.id, id))
    .returning()
    .get();
  if (!updated) throw new Error(`Vehicle ${id} not found`);
  return updated;
}

/** Periodic cleanings keep their texts; their link becomes null. */
export function deleteVehicle(db: SyncDatabase, id: number): void {
  db.delete(cleaningVehicles).where(eq(cleaningVehicles.id, id)).run();
}

// --- Periodic cleanings ---

/** Row of each active vehicle for `year`, skipping vehicles whose plate already has one. */
export function previewYear(db: SyncDatabase, year: number): YearPreview<CleaningVehicle, GeneratedRow> {
  return previewYearRows(
    listActiveVehicles(db),
    platesWithPeriodic(db, year),
    (vehicle) => vehicle.plateKey,
    (vehicle) => ({
      vehicleId: vehicle.id,
      plate: vehicle.plate,
      frequency: vehicle.frequency,
      productName: vehicle.productName,
      vehicleType: vehicle.vehicleType,
      reviewText: defaultReviewText(vehicle.frequency, year),
    }),
  );
}

/**
 * Saves reviewed rows of a generated year in one transaction. Rows whose
 * plate already has a periodic cleaning in the year (or that repeat a plate)
 * are skipped, so generating twice never duplicates.
 */
export function saveGeneratedYear(
  db: SyncDatabase,
  year: number,
  rows: readonly GeneratedRow[],
): { inserted: number; skipped: number } {
  return db.transaction((tx) => {
    const toInsert = newYearRows(rows, platesWithPeriodic(tx, year), (row) => plateKey(row.plate));
    if (toInsert.length > 0) {
      tx.insert(periodicCleanings)
        .values(toInsert.map((row) => ({ ...row, year, plateKey: plateKey(row.plate) })))
        .run();
    }
    return { inserted: toInsert.length, skipped: rows.length - toInsert.length };
  });
}

/** Periodic cleanings for the list: newest year first, then by plate. */
export function listPeriodic(db: SyncDatabase, filters: CleaningFilters = {}): PeriodicCleaning[] {
  return db
    .select()
    .from(periodicCleanings)
    .where(periodicFilters(filters))
    .orderBy(desc(periodicCleanings.year), asc(periodicCleanings.plateKey), asc(periodicCleanings.id))
    .all();
}

/** Periodic cleanings for export: oldest year first, then by plate. Both years inclusive. */
export function listPeriodicInYears(db: SyncDatabase, range: YearRange): PeriodicCleaning[] {
  return db
    .select()
    .from(periodicCleanings)
    .where(inYears(range))
    .orderBy(asc(periodicCleanings.year), asc(periodicCleanings.plateKey), asc(periodicCleanings.id))
    .all();
}

export function countPeriodicInYears(db: SyncDatabase, range: YearRange): number {
  const row: { count: number } | undefined = db
    .select({ count: sql<number>`count(*)` })
    .from(periodicCleanings)
    .where(inYears(range))
    .get();
  return row?.count ?? 0;
}

export function getPeriodic(db: SyncDatabase, id: number): PeriodicCleaning | undefined {
  return db.select().from(periodicCleanings).where(eq(periodicCleanings.id, id)).get();
}

/** Updates texts and year. The vehicle link is kept. */
export function updatePeriodic(db: SyncDatabase, id: number, input: PeriodicInput): PeriodicCleaning {
  return db.transaction((tx) => {
    const key = plateKey(input.plate);
    const clash = tx
      .select({ id: periodicCleanings.id })
      .from(periodicCleanings)
      .where(
        and(
          eq(periodicCleanings.year, input.year),
          eq(periodicCleanings.plateKey, key),
          ne(periodicCleanings.id, id),
        ),
      )
      .get();
    if (clash) throw new DuplicatePeriodicError(input.plate, input.year);
    const updated: PeriodicCleaning | undefined = tx
      .update(periodicCleanings)
      .set({ ...input, plateKey: key, ...touch })
      .where(eq(periodicCleanings.id, id))
      .returning()
      .get();
    if (!updated) throw new Error(`Periodic cleaning ${id} not found`);
    return updated;
  });
}

export function deletePeriodic(db: SyncDatabase, id: number): void {
  db.delete(periodicCleanings).where(eq(periodicCleanings.id, id)).run();
}

// --- One-off cleanings ---

/** One-off cleanings for the list: newest first. */
export function listOneOffs(db: SyncDatabase, filters: CleaningFilters = {}): OneOffCleaning[] {
  return db
    .select()
    .from(oneOffCleanings)
    .where(oneOffFilters(filters))
    .orderBy(desc(oneOffCleanings.date), desc(oneOffCleanings.id))
    .all();
}

/** One-off cleanings for export: oldest first, both ends inclusive. */
export function listOneOffsInRange(db: SyncDatabase, range: DateRange): OneOffCleaning[] {
  return db
    .select()
    .from(oneOffCleanings)
    .where(oneOffFilters(range))
    .orderBy(asc(oneOffCleanings.date), asc(oneOffCleanings.id))
    .all();
}

export function countOneOffsInRange(db: SyncDatabase, range: DateRange): number {
  const row: { count: number } | undefined = db
    .select({ count: sql<number>`count(*)` })
    .from(oneOffCleanings)
    .where(oneOffFilters(range))
    .get();
  return row?.count ?? 0;
}

export function getOneOff(db: SyncDatabase, id: number): OneOffCleaning | undefined {
  return db.select().from(oneOffCleanings).where(eq(oneOffCleanings.id, id)).get();
}

export function createOneOff(db: SyncDatabase, input: OneOffInput): OneOffCleaning {
  return db
    .insert(oneOffCleanings)
    .values({ ...input, plateKey: plateKey(input.plate) })
    .returning()
    .get();
}

export function updateOneOff(db: SyncDatabase, id: number, input: OneOffInput): OneOffCleaning {
  const updated: OneOffCleaning | undefined = db
    .update(oneOffCleanings)
    .set({ ...input, plateKey: plateKey(input.plate), ...touch })
    .where(eq(oneOffCleanings.id, id))
    .returning()
    .get();
  if (!updated) throw new Error(`One-off cleaning ${id} not found`);
  return updated;
}

export function deleteOneOff(db: SyncDatabase, id: number): void {
  db.delete(oneOffCleanings).where(eq(oneOffCleanings.id, id)).run();
}

// --- Suggestions and autocomplete ---

/** Product and type of the most recently saved vehicle or cleaning with this plate. */
export function lastRecordForPlate(
  db: SyncDatabase,
  plate: string,
): { productName: string; vehicleType: string } | undefined {
  const key = plateKey(plate);
  if (!key) return undefined;
  const rows: { productName: string; vehicleType: string }[] = db.all(sql`
    select product_name as productName, vehicle_type as vehicleType from (
      select product_name, vehicle_type, updated_at, id from vehicle_cleaning_vehicles where plate_key = ${key}
      union all
      select product_name, vehicle_type, updated_at, id from vehicle_cleaning_periodic where plate_key = ${key}
      union all
      select product_name, vehicle_type, updated_at, id from vehicle_cleaning_one_offs where plate_key = ${key}
    ) order by updated_at desc, id desc limit 1
  `);
  return rows[0];
}

/** Plates used in this module, most recent first, one per plate key. */
export function usedPlates(db: SyncDatabase): string[] {
  const rows: { plate: string; plateKey: string }[] = db.all(sql`
    select plate, plate_key as plateKey from (
      select plate, plate_key, updated_at from vehicle_cleaning_vehicles
      union all
      select plate, plate_key, updated_at from vehicle_cleaning_periodic
      union all
      select plate, plate_key, updated_at from vehicle_cleaning_one_offs
    ) order by updated_at desc
  `);
  return uniqueByPlate(rows.map((row) => row.plate));
}

/** Plates in order, once per plate key (ignoring case, spaces and hyphens). */
export function uniqueByPlate(plates: readonly string[]): string[] {
  const seen = new Set<string>();
  return plates.filter((plate) => {
    const key = plateKey(plate);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Product names used in this module. */
export function usedProductNames(db: SyncDatabase): string[] {
  return distinctTexts(db, 'product_name');
}

/** Preset vehicle types, then the ones used. */
export function vehicleTypeSuggestions(db: SyncDatabase): string[] {
  return mergeSuggestions(PRESET_VEHICLE_TYPES, distinctTexts(db, 'vehicle_type'));
}

/** Preset frequencies, then the ones used in vehicles and periodic cleanings. */
export function frequencySuggestions(db: SyncDatabase): string[] {
  const rows: { text: string }[] = db.all(sql`
    select frequency as text from vehicle_cleaning_vehicles
    union
    select frequency as text from vehicle_cleaning_periodic
    order by text collate nocase
  `);
  return mergeSuggestions(
    PRESET_FREQUENCIES,
    rows.map((row) => row.text),
  );
}

function distinctTexts(db: SyncDatabase, column: 'product_name' | 'vehicle_type'): string[] {
  const name = sql.raw(column);
  const rows: { text: string }[] = db.all(sql`
    select ${name} as text from vehicle_cleaning_vehicles
    union
    select ${name} as text from vehicle_cleaning_periodic
    union
    select ${name} as text from vehicle_cleaning_one_offs
    order by text collate nocase
  `);
  return mergeSuggestions(
    [],
    rows.map((row) => row.text),
  );
}

function platesWithPeriodic(db: SyncDatabase, year: number): Set<string> {
  const rows: { plateKey: string }[] = db
    .selectDistinct({ plateKey: periodicCleanings.plateKey })
    .from(periodicCleanings)
    .where(eq(periodicCleanings.year, year))
    .all();
  return new Set(rows.map((row) => row.plateKey));
}

function inYears({ fromYear, toYear }: YearRange): SQL | undefined {
  return and(gte(periodicCleanings.year, fromYear), lte(periodicCleanings.year, toYear));
}

function periodicFilters({ from, to, plate }: CleaningFilters): SQL | undefined {
  return and(
    from ? gte(periodicCleanings.year, Number(from.slice(0, 4))) : undefined,
    to ? lte(periodicCleanings.year, Number(to.slice(0, 4))) : undefined,
    plate ? eq(periodicCleanings.plateKey, plateKey(plate)) : undefined,
  );
}

function oneOffFilters({ from, to, plate }: CleaningFilters): SQL | undefined {
  return and(
    from ? gte(oneOffCleanings.date, from) : undefined,
    to ? lte(oneOffCleanings.date, to) : undefined,
    plate ? eq(oneOffCleanings.plateKey, plateKey(plate)) : undefined,
  );
}
