import { and, asc, desc, eq, gte, isNotNull, like, lte, sql, type SQL } from 'drizzle-orm';

import type { DateRange } from '@/core/dates';
import type { SyncDatabase } from '@/core/db/types';
import { mergeSuggestions } from '@/core/text';

import { normalizePlate, plateKey } from './plates';
import { vehicleRegulars, vehicleVisits, type VehicleRegular, type VehicleVisit } from './schema';
import { PRESET_FREQUENCIES, PRESET_REASONS } from './suggestions';
import type { VehicleType } from './vehicleTypes';

export type VehicleFilters = {
  /** Inclusive ISO dates for visits; omitted means open-ended. */
  from?: string | null;
  to?: string | null;
  /** Part of a plate, ignoring spaces and hyphens. */
  plate?: string | null;
  vehicleType?: VehicleType | null;
};

export type RegularInput = {
  plate: string;
  frequency: string;
  reason: string;
  vehicleType: VehicleType;
  active: boolean;
};

export type VisitInput = {
  date: string;
  plate: string;
  reason: string;
  vehicleType: VehicleType;
};

export type AutomaticVisitInput = VisitInput & {
  /** Id of the module creating the visit, e.g. `feed-entries`. */
  source: string;
};

/** Thrown when trying to change what only the source module may change. */
export class AutomaticVisitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AutomaticVisitError';
  }
}

const touch = { updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` };

// --- Regular vehicles ---

/** Active first, then by creation order. */
export function listRegulars(db: SyncDatabase, filters: VehicleFilters = {}): VehicleRegular[] {
  return db
    .select()
    .from(vehicleRegulars)
    .where(
      and(
        filters.plate ? like(vehicleRegulars.plateKey, `%${plateKey(filters.plate)}%`) : undefined,
        filters.vehicleType ? eq(vehicleRegulars.vehicleType, filters.vehicleType) : undefined,
      ),
    )
    .orderBy(desc(vehicleRegulars.active), asc(vehicleRegulars.id))
    .all();
}

/** Active regular vehicles in creation order, as they are exported. */
export function listActiveRegulars(db: SyncDatabase): VehicleRegular[] {
  return db
    .select()
    .from(vehicleRegulars)
    .where(eq(vehicleRegulars.active, true))
    .orderBy(asc(vehicleRegulars.id))
    .all();
}

export function getRegular(db: SyncDatabase, id: number): VehicleRegular | undefined {
  return db.select().from(vehicleRegulars).where(eq(vehicleRegulars.id, id)).get();
}

/** Creates (no `id`) or updates a regular vehicle. */
export function saveRegular(db: SyncDatabase, input: RegularInput, id?: number): VehicleRegular {
  const plate = normalizePlate(input.plate);
  const values = { ...input, plate, plateKey: plateKey(plate) };
  if (id === undefined) {
    return db.insert(vehicleRegulars).values(values).returning().get();
  }
  const updated: VehicleRegular | undefined = db
    .update(vehicleRegulars)
    .set({ ...values, ...touch })
    .where(eq(vehicleRegulars.id, id))
    .returning()
    .get();
  if (!updated) throw new Error(`Regular vehicle ${id} not found`);
  return updated;
}

export function deleteRegular(db: SyncDatabase, id: number): void {
  db.delete(vehicleRegulars).where(eq(vehicleRegulars.id, id)).run();
}

// --- Visits ---

/** Visits for the list: newest first. */
export function listVisits(db: SyncDatabase, filters: VehicleFilters = {}): VehicleVisit[] {
  return db
    .select()
    .from(vehicleVisits)
    .where(visitFilters(filters))
    .orderBy(desc(vehicleVisits.date), desc(vehicleVisits.id))
    .all();
}

/** Visits for export: oldest first, both ends inclusive. */
export function listVisitsInRange(db: SyncDatabase, range: DateRange): VehicleVisit[] {
  return db
    .select()
    .from(vehicleVisits)
    .where(visitFilters(range))
    .orderBy(asc(vehicleVisits.date), asc(vehicleVisits.id))
    .all();
}

export function countVisitsInRange(db: SyncDatabase, range: DateRange): number {
  const row: { count: number } | undefined = db
    .select({ count: sql<number>`count(*)` })
    .from(vehicleVisits)
    .where(visitFilters(range))
    .get();
  return row?.count ?? 0;
}

export function getVisit(db: SyncDatabase, id: number): VehicleVisit | undefined {
  return db.select().from(vehicleVisits).where(eq(vehicleVisits.id, id)).get();
}

export function isAutomatic(visit: Pick<VehicleVisit, 'source'>): boolean {
  return visit.source !== null;
}

/**
 * Creates (no `id`) a manual visit or updates any visit. Date and plate of an
 * automatic visit can only change from the module that created it.
 */
export function saveVisit(db: SyncDatabase, input: VisitInput, id?: number): VehicleVisit {
  const plate = normalizePlate(input.plate);
  const values = { ...input, plate, plateKey: plateKey(plate) };
  if (id === undefined) {
    return db.insert(vehicleVisits).values(values).returning().get();
  }
  return db.transaction((tx) => {
    const current = getVisit(tx, id);
    if (!current) throw new Error(`Visit ${id} not found`);
    if (isAutomatic(current) && (current.date !== values.date || current.plateKey !== values.plateKey)) {
      throw new AutomaticVisitError(
        'La fecha y la matrícula de una visita automática se cambian desde el registro que la creó',
      );
    }
    return tx
      .update(vehicleVisits)
      .set({ ...values, ...touch })
      .where(eq(vehicleVisits.id, id))
      .returning()
      .get();
  });
}

/** Deletes a manual visit. Automatic visits are deleted from the module that created them. */
export function deleteVisit(db: SyncDatabase, id: number): void {
  const visit = getVisit(db, id);
  if (!visit) return;
  if (isAutomatic(visit)) {
    throw new AutomaticVisitError('Una visita automática se borra desde el registro que la creó');
  }
  db.delete(vehicleVisits).where(eq(vehicleVisits.id, id)).run();
}

/**
 * Automatic visit of `source` for the date and plate: the existing one, or a
 * new one with the given reason and type. Call it inside the caller's
 * transaction.
 */
export function linkAutomaticVisit(tx: SyncDatabase, input: AutomaticVisitInput): VehicleVisit {
  const plate = normalizePlate(input.plate);
  const key = plateKey(plate);
  const existing: VehicleVisit | undefined = tx
    .select()
    .from(vehicleVisits)
    .where(
      and(
        eq(vehicleVisits.source, input.source),
        eq(vehicleVisits.date, input.date),
        eq(vehicleVisits.plateKey, key),
      ),
    )
    .get();
  if (existing) return existing;
  return tx
    .insert(vehicleVisits)
    .values({
      date: input.date,
      plate,
      plateKey: key,
      reason: input.reason,
      vehicleType: input.vehicleType,
      source: input.source,
    })
    .returning()
    .get();
}

/** Deletes an automatic visit. The caller decides when it has no records left. */
export function deleteAutomaticVisit(tx: SyncDatabase, id: number): void {
  tx.delete(vehicleVisits)
    .where(and(eq(vehicleVisits.id, id), isNotNull(vehicleVisits.source)))
    .run();
}

// --- Suggestions and autocomplete ---

/** Type and reason of the most recently saved record (regular or visit) with this plate. */
export function lastRecordForPlate(
  db: SyncDatabase,
  plate: string,
): { vehicleType: VehicleType; reason: string } | undefined {
  const key = plateKey(plate);
  if (!key) return undefined;
  const pick = { vehicleType: vehicleRegulars.vehicleType, reason: vehicleRegulars.reason };
  const regular = db
    .select({ ...pick, updatedAt: vehicleRegulars.updatedAt })
    .from(vehicleRegulars)
    .where(eq(vehicleRegulars.plateKey, key))
    .orderBy(desc(vehicleRegulars.updatedAt), desc(vehicleRegulars.id))
    .get();
  const visit = db
    .select({
      vehicleType: vehicleVisits.vehicleType,
      reason: vehicleVisits.reason,
      updatedAt: vehicleVisits.updatedAt,
    })
    .from(vehicleVisits)
    .where(eq(vehicleVisits.plateKey, key))
    .orderBy(desc(vehicleVisits.updatedAt), desc(vehicleVisits.id))
    .get();
  const latest = !regular ? visit : !visit ? regular : visit.updatedAt >= regular.updatedAt ? visit : regular;
  return latest ? { vehicleType: latest.vehicleType, reason: latest.reason } : undefined;
}

/** Plates already used, most recent first, one per plate key. */
export function listUsedPlates(db: SyncDatabase): string[] {
  const rows: { plate: string; plateKey: string }[] = db.all(sql`
    select plate, plate_key as plateKey from (
      select plate, plate_key, updated_at from vehicle_visits
      union all
      select plate, plate_key, updated_at from vehicle_regulars
    ) order by updated_at desc
  `);
  const seen = new Set<string>();
  return rows.flatMap((row) => {
    if (seen.has(row.plateKey)) return [];
    seen.add(row.plateKey);
    return [row.plate];
  });
}

/** Preset reasons, then the ones used in regulars and visits. */
export function reasonSuggestions(db: SyncDatabase): string[] {
  const rows: { reason: string }[] = db.all(sql`
    select reason from vehicle_regulars
    union
    select reason from vehicle_visits
    order by reason collate nocase
  `);
  return mergeSuggestions(
    PRESET_REASONS,
    rows.map((row) => row.reason),
  );
}

/** Preset frequencies, then the ones used in regulars. */
export function frequencySuggestions(db: SyncDatabase): string[] {
  const rows: { frequency: string }[] = db
    .selectDistinct({ frequency: vehicleRegulars.frequency })
    .from(vehicleRegulars)
    .orderBy(sql`${vehicleRegulars.frequency} collate nocase`)
    .all();
  return mergeSuggestions(
    PRESET_FREQUENCIES,
    rows.map((row) => row.frequency),
  );
}

function visitFilters({ from, to, plate, vehicleType }: VehicleFilters): SQL | undefined {
  return and(
    from ? gte(vehicleVisits.date, from) : undefined,
    to ? lte(vehicleVisits.date, to) : undefined,
    plate ? like(vehicleVisits.plateKey, `%${plateKey(plate)}%`) : undefined,
    vehicleType ? eq(vehicleVisits.vehicleType, vehicleType) : undefined,
  );
}
