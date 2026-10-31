import { and, asc, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';

import type { SyncDatabase } from '@/core/db/types';
import type { YearRange } from '@/core/export/types';
import { nameKey } from '@/core/text';

import { hygieneRecords, hygieneTemplates, type HygieneRecord, type HygieneTemplate } from './schema';
import { fillYear, toTemplateText } from './templates';
import { listActiveTemplates, saveTemplate } from './templatesRepository';

/** Texts of a row, as on the paper form (without year and farm code). */
export type RecordFields = {
  productiveUnit: string;
  action: string;
  place: string;
  result: string;
  correctiveMeasures: string | null;
  dateText: string;
};

export type RecordInput = RecordFields & {
  year: number;
  /** Template the row was filled from; null if typed from scratch. */
  templateId: number | null;
};

export type RecordFilters = {
  year?: number | null;
  action?: string | null;
};

/** A row proposed when generating a year, before the user reviews it. */
export type GeneratedRow = RecordFields & { templateId: number; position: number };

export type YearPreview = {
  rows: GeneratedRow[];
  /** Active templates that already have a row in the year. */
  skipped: HygieneTemplate[];
};

const updatedNow = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

/** Rows for the list: newest year first, then in template order. */
export function listRecords(db: SyncDatabase, filters: RecordFilters = {}): HygieneRecord[] {
  return db
    .select()
    .from(hygieneRecords)
    .where(whereFilters(filters))
    .orderBy(desc(hygieneRecords.year), asc(hygieneRecords.position), asc(hygieneRecords.id))
    .all();
}

/** Rows for export: oldest year first, then in template order. Both years inclusive. */
export function listRecordsInYearRange(db: SyncDatabase, range: YearRange): HygieneRecord[] {
  return db
    .select()
    .from(hygieneRecords)
    .where(inYears(range))
    .orderBy(asc(hygieneRecords.year), asc(hygieneRecords.position), asc(hygieneRecords.id))
    .all();
}

export function countRecordsInYearRange(db: SyncDatabase, range: YearRange): number {
  const row: { count: number } | undefined = db
    .select({ count: sql<number>`count(*)` })
    .from(hygieneRecords)
    .where(inYears(range))
    .get();
  return row?.count ?? 0;
}

/** Years with rows, newest first, for the list filter. */
export function listRecordYears(db: SyncDatabase): number[] {
  const rows: { year: number }[] = db
    .selectDistinct({ year: hygieneRecords.year })
    .from(hygieneRecords)
    .orderBy(desc(hygieneRecords.year))
    .all();
  return rows.map((row) => row.year);
}

/** Distinct actions used in rows, for the list filter. */
export function listRecordActions(db: SyncDatabase): string[] {
  const rows: { action: string }[] = db
    .selectDistinct({ action: hygieneRecords.action })
    .from(hygieneRecords)
    .orderBy(sql`${hygieneRecords.action} collate nocase`)
    .all();
  return rows.map((row) => row.action);
}

/** Actions and places already used in templates or rows, for suggestions. */
export function fieldSuggestions(db: SyncDatabase): { actions: string[]; places: string[] } {
  const templates: { action: string; place: string }[] = db
    .select({ action: hygieneTemplates.action, place: hygieneTemplates.place })
    .from(hygieneTemplates)
    .all();
  const records: { action: string; place: string }[] = db
    .selectDistinct({ action: hygieneRecords.action, place: hygieneRecords.place })
    .from(hygieneRecords)
    .all();
  const all = [...templates, ...records];
  return {
    actions: distinctNames(all.map((row) => row.action)),
    places: distinctNames(all.map((row) => row.place)),
  };
}

export function getRecord(db: SyncDatabase, id: number): HygieneRecord | undefined {
  return db.select().from(hygieneRecords).where(eq(hygieneRecords.id, id)).get();
}

/**
 * Creates a row with the given farm code snapshot. Rows from a template go
 * in the template's position; rows from scratch go last in their year. With
 * `saveAsTemplate`, a template is created from the row (the year becomes
 * `{año}`) and the row is linked to it.
 */
export function createRecord(
  db: SyncDatabase,
  input: RecordInput,
  farmCode: string,
  options: { saveAsTemplate?: boolean } = {},
): HygieneRecord {
  return db.transaction((tx) => {
    let templateId = input.templateId;
    if (templateId === null && options.saveAsTemplate) {
      templateId = saveTemplate(tx, templateFromRecord(input)).id;
    }
    const template: { sortOrder: number } | undefined =
      templateId === null
        ? undefined
        : tx
            .select({ sortOrder: hygieneTemplates.sortOrder })
            .from(hygieneTemplates)
            .where(eq(hygieneTemplates.id, templateId))
            .get();
    const position = template?.sortOrder ?? nextPosition(tx, input.year);
    return tx
      .insert(hygieneRecords)
      .values({ ...input, templateId: template ? templateId : null, farmCode, position })
      .returning()
      .get();
  });
}

/** Updates the texts and year. The farm code, template link and position are kept. */
export function updateRecord(
  db: SyncDatabase,
  id: number,
  input: RecordFields & { year: number },
): HygieneRecord {
  const saved: HygieneRecord | undefined = db
    .update(hygieneRecords)
    .set({
      year: input.year,
      productiveUnit: input.productiveUnit,
      action: input.action,
      place: input.place,
      result: input.result,
      correctiveMeasures: input.correctiveMeasures,
      dateText: input.dateText,
      updatedAt: updatedNow,
    })
    .where(eq(hygieneRecords.id, id))
    .returning()
    .get();
  if (!saved) throw new Error(`Record ${id} not found`);
  return saved;
}

export function deleteRecord(db: SyncDatabase, id: number): void {
  db.delete(hygieneRecords).where(eq(hygieneRecords.id, id)).run();
}

/** Row of each active template for `year`, skipping templates that already have one. */
export function previewYear(db: SyncDatabase, year: number): YearPreview {
  const existing = templatesWithRows(db, year);
  const preview: YearPreview = { rows: [], skipped: [] };
  for (const template of listActiveTemplates(db)) {
    if (existing.has(template.id)) {
      preview.skipped.push(template);
    } else {
      preview.rows.push({
        templateId: template.id,
        position: template.sortOrder,
        productiveUnit: template.productiveUnit,
        action: template.action,
        place: template.place,
        result: fillYear(template.result, year),
        correctiveMeasures: template.correctiveMeasures,
        dateText: fillYear(template.dateText, year),
      });
    }
  }
  return preview;
}

/**
 * Saves reviewed rows of a generated year in one transaction. Rows whose
 * template already has a row in the year (or that repeat a template) are
 * skipped, so generating twice never duplicates.
 */
export function saveGeneratedYear(
  db: SyncDatabase,
  year: number,
  farmCode: string,
  rows: readonly GeneratedRow[],
): { inserted: number; skipped: number } {
  return db.transaction((tx) => {
    const taken = templatesWithRows(tx, year);
    const toInsert = rows.filter((row) => {
      if (taken.has(row.templateId)) return false;
      taken.add(row.templateId);
      return true;
    });
    if (toInsert.length > 0) {
      tx.insert(hygieneRecords)
        .values(toInsert.map((row) => ({ ...row, year, farmCode })))
        .run();
    }
    return { inserted: toInsert.length, skipped: rows.length - toInsert.length };
  });
}

/** Template values from a row: the row's year becomes `{año}` in result and date. */
export function templateFromRecord(input: RecordFields & { year: number }) {
  return {
    action: input.action,
    productiveUnit: input.productiveUnit,
    place: input.place,
    result: toTemplateText(input.result, input.year),
    correctiveMeasures: input.correctiveMeasures,
    dateText: toTemplateText(input.dateText, input.year),
    active: true,
  };
}

function templatesWithRows(db: SyncDatabase, year: number): Set<number> {
  const rows: { templateId: number | null }[] = db
    .selectDistinct({ templateId: hygieneRecords.templateId })
    .from(hygieneRecords)
    .where(eq(hygieneRecords.year, year))
    .all();
  return new Set(rows.flatMap((row) => (row.templateId === null ? [] : [row.templateId])));
}

function nextPosition(db: SyncDatabase, year: number): number {
  const row: { max: number | null } | undefined = db
    .select({ max: sql<number | null>`max(${hygieneRecords.position})` })
    .from(hygieneRecords)
    .where(eq(hygieneRecords.year, year))
    .get();
  const templates: { max: number | null } | undefined = db
    .select({ max: sql<number | null>`max(${hygieneTemplates.sortOrder})` })
    .from(hygieneTemplates)
    .get();
  return Math.max(row?.max ?? -1, templates?.max ?? -1) + 1;
}

function distinctNames(names: string[]): string[] {
  const seen = new Map<string, string>();
  for (const name of names) {
    const key = nameKey(name);
    if (key && !seen.has(key)) seen.set(key, name);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

function inYears({ fromYear, toYear }: YearRange): SQL | undefined {
  return and(gte(hygieneRecords.year, fromYear), lte(hygieneRecords.year, toYear));
}

function whereFilters({ year, action }: RecordFilters): SQL | undefined {
  return and(
    year ? eq(hygieneRecords.year, year) : undefined,
    action ? eq(hygieneRecords.action, action) : undefined,
  );
}
