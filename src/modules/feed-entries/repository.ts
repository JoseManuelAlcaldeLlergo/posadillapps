import { and, asc, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';

import type { DateRange } from '@/core/dates';
import type { SyncDatabase } from '@/core/db/types';

import { deleteAutomaticVisit, linkAutomaticVisit, normalizePlate } from '../vehicle-entries';
import {
  addFeed,
  addTruck,
  createSupplier,
  findFeedByName,
  findSupplierByName,
  findTruckByPlate,
} from './favoritesRepository';
import { feedEntries, type FeedEntry } from './schema';
import type { FeedUnit } from './units';

/** `source` of the automatic visits this module creates in the vehicles module. */
export const FEED_VISIT_SOURCE = 'feed-entries';

/** Reason and type of the automatic visit of a feed delivery. */
const FEED_DELIVERY_VISIT = { reason: 'Transporte de pienso', vehicleType: 'feed_truck' } as const;

export type EntryFilters = {
  /** Inclusive ISO dates; omitted means open-ended. */
  from?: string | null;
  to?: string | null;
  supplierName?: string | null;
  /** Entries linked to this automatic vehicle visit. */
  vehicleVisitId?: number | null;
};

export type EntryInput = {
  date: string;
  quantity: number;
  unit: FeedUnit;
  supplierName: string;
  feedName: string;
  invoice: string | null;
  /** Plate of the delivery truck; null if not given (then no visit is created). */
  truckPlate: string | null;
};

export type FavoriteOptions = {
  /** Create the supplier as favorite if it does not exist yet. */
  saveSupplier: boolean;
  /** Create the feed in the supplier's favorites if it does not exist yet. */
  saveFeed: boolean;
  /** Add the truck to the supplier's usual trucks if it is not there yet. */
  saveTruck?: boolean;
};

const NO_FAVORITES: FavoriteOptions = { saveSupplier: false, saveFeed: false, saveTruck: false };

/** Entries for the list: newest first. */
export function listEntries(db: SyncDatabase, filters: EntryFilters = {}): FeedEntry[] {
  return db
    .select()
    .from(feedEntries)
    .where(whereFilters(filters))
    .orderBy(desc(feedEntries.date), desc(feedEntries.id))
    .all();
}

/** Entries for export: oldest first, both ends inclusive. */
export function listEntriesInRange(db: SyncDatabase, range: DateRange): FeedEntry[] {
  return db
    .select()
    .from(feedEntries)
    .where(whereFilters(range))
    .orderBy(asc(feedEntries.date), asc(feedEntries.id))
    .all();
}

export function countEntriesInRange(db: SyncDatabase, range: DateRange): number {
  const row: { count: number } | undefined = db
    .select({ count: sql<number>`count(*)` })
    .from(feedEntries)
    .where(whereFilters(range))
    .get();
  return row?.count ?? 0;
}

/** Distinct supplier names used in entries, for the list filter. */
export function listEntrySupplierNames(db: SyncDatabase): string[] {
  const rows: { name: string }[] = db
    .selectDistinct({ name: feedEntries.supplierName })
    .from(feedEntries)
    .orderBy(sql`${feedEntries.supplierName} collate nocase`)
    .all();
  return rows.map((row) => row.name);
}

export function getEntry(db: SyncDatabase, id: number): FeedEntry | undefined {
  return db.select().from(feedEntries).where(eq(feedEntries.id, id)).get();
}

/**
 * Creates (no `id`) or updates an entry. Links it to the matching favorite
 * supplier/feed/truck and, if requested, creates missing favorites. When it
 * matches a favorite, the snapshot uses the favorite's spelling.
 *
 * With a truck plate, the entry is linked to the automatic vehicle visit of
 * that truck and date (created if needed). A visit left without entries is
 * deleted. Everything happens in one transaction.
 */
export function saveEntry(
  db: SyncDatabase,
  input: EntryInput,
  favorites: FavoriteOptions = NO_FAVORITES,
  id?: number,
): FeedEntry {
  return db.transaction((tx) => {
    const previous = id === undefined ? undefined : getEntry(tx, id);
    if (id !== undefined && !previous) throw new Error(`Entry ${id} not found`);

    const supplier =
      findSupplierByName(tx, input.supplierName) ??
      (favorites.saveSupplier ? createSupplier(tx, input.supplierName) : undefined);
    const feed = supplier
      ? (findFeedByName(tx, supplier.id, input.feedName) ??
        (favorites.saveFeed ? addFeed(tx, supplier.id, input.feedName) : undefined))
      : undefined;

    const plate = input.truckPlate ? normalizePlate(input.truckPlate) : '';
    const truck =
      supplier && plate
        ? (findTruckByPlate(tx, supplier.id, plate) ??
          (favorites.saveTruck ? addTruck(tx, supplier.id, plate) : undefined))
        : undefined;
    const truckPlate = truck?.plate ?? (plate || null);
    const visit = truckPlate
      ? linkAutomaticVisit(tx, {
          source: FEED_VISIT_SOURCE,
          date: input.date,
          plate: truckPlate,
          ...FEED_DELIVERY_VISIT,
        })
      : undefined;

    const values = {
      date: input.date,
      quantity: input.quantity,
      unit: input.unit,
      supplierName: supplier?.name ?? input.supplierName,
      supplierId: supplier?.id ?? null,
      feedName: feed?.name ?? input.feedName,
      feedId: feed?.id ?? null,
      invoice: input.invoice,
      truckPlate,
      truckId: truck?.id ?? null,
      vehicleVisitId: visit?.id ?? null,
    };

    const saved: FeedEntry =
      id === undefined
        ? tx.insert(feedEntries).values(values).returning().get()
        : tx
            .update(feedEntries)
            .set({ ...values, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
            .where(eq(feedEntries.id, id))
            .returning()
            .get();

    if (previous?.vehicleVisitId && previous.vehicleVisitId !== saved.vehicleVisitId) {
      releaseVisit(tx, previous.vehicleVisitId);
    }
    return saved;
  });
}

/** Deletes the entry and, if it was the last one of its vehicle visit, the visit. */
export function deleteEntry(db: SyncDatabase, id: number): void {
  db.transaction((tx) => {
    const entry = getEntry(tx, id);
    if (!entry) return;
    tx.delete(feedEntries).where(eq(feedEntries.id, id)).run();
    if (entry.vehicleVisitId) releaseVisit(tx, entry.vehicleVisitId);
  });
}

/** Deletes the automatic visit when no entry is linked to it any more. */
function releaseVisit(tx: SyncDatabase, visitId: number): void {
  const row: { count: number } | undefined = tx
    .select({ count: sql<number>`count(*)` })
    .from(feedEntries)
    .where(eq(feedEntries.vehicleVisitId, visitId))
    .get();
  if ((row?.count ?? 0) === 0) deleteAutomaticVisit(tx, visitId);
}

function whereFilters({ from, to, supplierName, vehicleVisitId }: EntryFilters): SQL | undefined {
  return and(
    from ? gte(feedEntries.date, from) : undefined,
    to ? lte(feedEntries.date, to) : undefined,
    supplierName ? eq(feedEntries.supplierName, supplierName) : undefined,
    vehicleVisitId ? eq(feedEntries.vehicleVisitId, vehicleVisitId) : undefined,
  );
}
