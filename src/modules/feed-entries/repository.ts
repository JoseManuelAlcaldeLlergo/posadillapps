import { and, asc, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';

import type { DateRange } from '@/core/dates';
import type { SyncDatabase } from '@/core/db/types';

import { addFeed, createSupplier, findFeedByName, findSupplierByName } from './favoritesRepository';
import { feedEntries, type FeedEntry } from './schema';
import type { FeedUnit } from './units';

export type EntryFilters = {
  /** Inclusive ISO dates; omitted means open-ended. */
  from?: string | null;
  to?: string | null;
  supplierName?: string | null;
};

export type EntryInput = {
  date: string;
  quantity: number;
  unit: FeedUnit;
  supplierName: string;
  feedName: string;
  invoice: string | null;
};

export type FavoriteOptions = {
  /** Create the supplier as favorite if it does not exist yet. */
  saveSupplier: boolean;
  /** Create the feed in the supplier's favorites if it does not exist yet. */
  saveFeed: boolean;
};

const NO_FAVORITES: FavoriteOptions = { saveSupplier: false, saveFeed: false };

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
 * supplier/feed and, if requested, creates missing favorites. When it matches
 * a favorite, the snapshot uses the favorite's spelling.
 */
export function saveEntry(
  db: SyncDatabase,
  input: EntryInput,
  favorites: FavoriteOptions = NO_FAVORITES,
  id?: number,
): FeedEntry {
  return db.transaction((tx) => {
    const supplier =
      findSupplierByName(tx, input.supplierName) ??
      (favorites.saveSupplier ? createSupplier(tx, input.supplierName) : undefined);
    const feed = supplier
      ? (findFeedByName(tx, supplier.id, input.feedName) ??
        (favorites.saveFeed ? addFeed(tx, supplier.id, input.feedName) : undefined))
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
    };

    if (id === undefined) {
      return tx.insert(feedEntries).values(values).returning().get();
    }
    const updated: FeedEntry | undefined = tx
      .update(feedEntries)
      .set({ ...values, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
      .where(eq(feedEntries.id, id))
      .returning()
      .get();
    if (!updated) throw new Error(`Entry ${id} not found`);
    return updated;
  });
}

export function deleteEntry(db: SyncDatabase, id: number): void {
  db.delete(feedEntries).where(eq(feedEntries.id, id)).run();
}

function whereFilters({ from, to, supplierName }: EntryFilters): SQL | undefined {
  return and(
    from ? gte(feedEntries.date, from) : undefined,
    to ? lte(feedEntries.date, to) : undefined,
    supplierName ? eq(feedEntries.supplierName, supplierName) : undefined,
  );
}
