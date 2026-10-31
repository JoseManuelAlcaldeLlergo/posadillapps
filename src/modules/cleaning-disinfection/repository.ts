import { and, asc, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';

import type { DateRange } from '@/core/dates';
import type { SyncDatabase } from '@/core/db/types';
import { mergeSuggestions, nameKey } from '@/core/text';

import { findProductByName, saveProduct } from './productsRepository';
import {
  cleaningApplications,
  cleaningRegulars,
  type CleaningApplication,
  type CleaningRegular,
} from './schema';
import { PRESET_FREQUENCIES, PRESET_PLACES } from './suggestions';

/** Fields shared by applications and regular applications, already validated. */
export type RecordFields = {
  productiveUnit: string;
  productName: string;
  place: string;
  waitingDays: number;
  /** ISO `YYYY-MM-DD`, or null if not reviewed. */
  reviewDate: string | null;
};

export type ApplicationInput = RecordFields & { date: string };

export type RegularInput = RecordFields & { frequency: string; active: boolean };

export type SaveOptions = {
  /** Saves a product not yet in favorites, with the record's waiting period and place. */
  saveProduct?: boolean;
};

export type CleaningFilters = {
  /** Inclusive ISO dates for applications; omitted means open-ended. */
  from?: string | null;
  to?: string | null;
  /** Exact product, ignoring case and accents. */
  product?: string | null;
};

const touch = { updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` };

/**
 * Snapshot of the product name plus the link to its favorite, creating the
 * favorite first if asked to.
 */
function productColumns(tx: SyncDatabase, fields: RecordFields, options: SaveOptions) {
  let product = findProductByName(tx, fields.productName);
  if (!product && options.saveProduct) {
    product = saveProduct(tx, {
      name: fields.productName,
      defaultWaitingDays: fields.waitingDays,
      defaultPlace: fields.place,
    });
  }
  return {
    productName: fields.productName,
    productKey: nameKey(fields.productName),
    productId: product?.id ?? null,
  };
}

// --- Applications ---

/** Applications for the list: newest first. */
export function listApplications(db: SyncDatabase, filters: CleaningFilters = {}): CleaningApplication[] {
  return db
    .select()
    .from(cleaningApplications)
    .where(applicationFilters(filters))
    .orderBy(desc(cleaningApplications.date), desc(cleaningApplications.id))
    .all();
}

/** Applications for export: oldest first, both ends inclusive. */
export function listApplicationsInRange(db: SyncDatabase, range: DateRange): CleaningApplication[] {
  return db
    .select()
    .from(cleaningApplications)
    .where(applicationFilters(range))
    .orderBy(asc(cleaningApplications.date), asc(cleaningApplications.id))
    .all();
}

export function countApplicationsInRange(db: SyncDatabase, range: DateRange): number {
  const row: { count: number } | undefined = db
    .select({ count: sql<number>`count(*)` })
    .from(cleaningApplications)
    .where(applicationFilters(range))
    .get();
  return row?.count ?? 0;
}

export function getApplication(db: SyncDatabase, id: number): CleaningApplication | undefined {
  return db.select().from(cleaningApplications).where(eq(cleaningApplications.id, id)).get();
}

/** Creates an application with the given farm code snapshot. */
export function createApplication(
  db: SyncDatabase,
  input: ApplicationInput,
  farmCode: string,
  options: SaveOptions = {},
): CleaningApplication {
  return db.transaction((tx) =>
    tx
      .insert(cleaningApplications)
      .values({ ...input, ...productColumns(tx, input, options), farmCode })
      .returning()
      .get(),
  );
}

/** Updates an application. The farm code it was created with is kept. */
export function updateApplication(
  db: SyncDatabase,
  id: number,
  input: ApplicationInput,
  options: SaveOptions = {},
): CleaningApplication {
  return db.transaction((tx) => {
    const updated: CleaningApplication | undefined = tx
      .update(cleaningApplications)
      .set({ ...input, ...productColumns(tx, input, options), ...touch })
      .where(eq(cleaningApplications.id, id))
      .returning()
      .get();
    if (!updated) throw new Error(`Application ${id} not found`);
    return updated;
  });
}

export function deleteApplication(db: SyncDatabase, id: number): void {
  db.delete(cleaningApplications).where(eq(cleaningApplications.id, id)).run();
}

// --- Regular applications ---

/** Active first, then by creation order. */
export function listRegulars(db: SyncDatabase, filters: CleaningFilters = {}): CleaningRegular[] {
  return db
    .select()
    .from(cleaningRegulars)
    .where(filters.product ? eq(cleaningRegulars.productKey, nameKey(filters.product)) : undefined)
    .orderBy(desc(cleaningRegulars.active), asc(cleaningRegulars.id))
    .all();
}

/** Active regular applications in creation order, as they are exported. */
export function listActiveRegulars(db: SyncDatabase): CleaningRegular[] {
  return db
    .select()
    .from(cleaningRegulars)
    .where(eq(cleaningRegulars.active, true))
    .orderBy(asc(cleaningRegulars.id))
    .all();
}

export function getRegular(db: SyncDatabase, id: number): CleaningRegular | undefined {
  return db.select().from(cleaningRegulars).where(eq(cleaningRegulars.id, id)).get();
}

/** Creates a regular application with the given farm code snapshot. */
export function createRegular(
  db: SyncDatabase,
  input: RegularInput,
  farmCode: string,
  options: SaveOptions = {},
): CleaningRegular {
  return db.transaction((tx) =>
    tx
      .insert(cleaningRegulars)
      .values({ ...input, ...productColumns(tx, input, options), farmCode })
      .returning()
      .get(),
  );
}

/** Updates a regular application. The farm code it was created with is kept. */
export function updateRegular(
  db: SyncDatabase,
  id: number,
  input: RegularInput,
  options: SaveOptions = {},
): CleaningRegular {
  return db.transaction((tx) => {
    const updated: CleaningRegular | undefined = tx
      .update(cleaningRegulars)
      .set({ ...input, ...productColumns(tx, input, options), ...touch })
      .where(eq(cleaningRegulars.id, id))
      .returning()
      .get();
    if (!updated) throw new Error(`Regular application ${id} not found`);
    return updated;
  });
}

export function deleteRegular(db: SyncDatabase, id: number): void {
  db.delete(cleaningRegulars).where(eq(cleaningRegulars.id, id)).run();
}

// --- Suggestions and defaults ---

/** Productive unit of the most recently saved record, to preselect it in new ones. */
export function lastProductiveUnit(db: SyncDatabase): string | null {
  const rows: { productiveUnit: string }[] = db.all(sql`
    select productive_unit as productiveUnit from (
      select productive_unit, updated_at, id from cleaning_applications
      union all
      select productive_unit, updated_at, id from cleaning_regulars
    ) order by updated_at desc, id desc limit 1
  `);
  return rows[0]?.productiveUnit ?? null;
}

/** Preset places, then the ones used in favorites and records. */
export function placeSuggestions(db: SyncDatabase): string[] {
  const rows: { place: string }[] = db.all(sql`
    select default_place as place from cleaning_products where default_place is not null
    union
    select place from cleaning_regulars
    union
    select place from cleaning_applications
    order by place collate nocase
  `);
  return mergeSuggestions(
    PRESET_PLACES,
    rows.map((row) => row.place),
  );
}

/** Preset frequencies, then the ones used in regular applications. */
export function frequencySuggestions(db: SyncDatabase): string[] {
  const rows: { frequency: string }[] = db
    .selectDistinct({ frequency: cleaningRegulars.frequency })
    .from(cleaningRegulars)
    .orderBy(sql`${cleaningRegulars.frequency} collate nocase`)
    .all();
  return mergeSuggestions(
    PRESET_FREQUENCIES,
    rows.map((row) => row.frequency),
  );
}

/** Products of favorites and records, once each by name, for the list filter. */
export function usedProductNames(db: SyncDatabase): string[] {
  const rows: { name: string }[] = db.all(sql`
    select name from cleaning_products
    union
    select product_name as name from cleaning_regulars
    union
    select product_name as name from cleaning_applications
    order by name collate nocase
  `);
  return mergeSuggestions(
    [],
    rows.map((row) => row.name),
  );
}

function applicationFilters({ from, to, product }: CleaningFilters): SQL | undefined {
  return and(
    from ? gte(cleaningApplications.date, from) : undefined,
    to ? lte(cleaningApplications.date, to) : undefined,
    product ? eq(cleaningApplications.productKey, nameKey(product)) : undefined,
  );
}
