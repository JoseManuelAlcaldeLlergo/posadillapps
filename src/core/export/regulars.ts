import type { CellValue } from './types';

/**
 * Export row of a record made with a fixed frequency and not written down
 * each time (e.g. `A diario`). Its frequency goes in the FECHA column.
 */
export type RegularExportRow = { kind: 'regular'; id: number; frequency: string };

/** Export row of a record on a real date. `kind` is chosen by each module, e.g. `visit`. */
export type DatedExportRow = { kind: string; id: number; date: string };

export type RegularOrDatedRow = RegularExportRow | DatedExportRow;

export function isRegularRow(row: RegularOrDatedRow): row is RegularExportRow {
  return row.kind === 'regular';
}

/** FECHA column: the frequency of a regular record as text, or the real date. */
export function regularOrDateCell(row: RegularOrDatedRow): CellValue {
  return isRegularRow(row) ? { kind: 'text', value: row.frequency } : { kind: 'date', iso: row.date };
}

/** Regular records first, in creation order; then dated records by date. */
export function compareRegularsFirst(a: RegularOrDatedRow, b: RegularOrDatedRow): number {
  const aRegular = isRegularRow(a);
  if (aRegular !== isRegularRow(b)) return aRegular ? -1 : 1;
  if (!isRegularRow(a) && !isRegularRow(b)) return a.date.localeCompare(b.date) || a.id - b.id;
  return a.id - b.id;
}
