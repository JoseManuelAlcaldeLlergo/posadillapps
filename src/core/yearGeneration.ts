/**
 * "Generate year": one row per active source (a template, a vehicle…) for a
 * chosen year, without duplicating sources that already have a row in it.
 */

/** Rows proposed for a year, before the user reviews them. */
export type YearPreview<Source, Row> = {
  rows: Row[];
  /** Active sources that already have a row in the year. */
  skipped: Source[];
};

/** One row per source, in order, skipping sources whose key is in `taken`. */
export function previewYearRows<Source, Row, Key>(
  sources: readonly Source[],
  taken: ReadonlySet<Key>,
  sourceKey: (source: Source) => Key,
  toRow: (source: Source) => Row,
): YearPreview<Source, Row> {
  const preview: YearPreview<Source, Row> = { rows: [], skipped: [] };
  for (const source of sources) {
    if (taken.has(sourceKey(source))) preview.skipped.push(source);
    else preview.rows.push(toRow(source));
  }
  return preview;
}

/**
 * Rows to insert when saving a reviewed year: those whose source has no row
 * yet in the year, once per source. Adds their keys to `taken`.
 */
export function newYearRows<Row, Key>(
  rows: readonly Row[],
  taken: Set<Key>,
  rowKey: (row: Row) => Key,
): Row[] {
  return rows.filter((row) => {
    const key = rowKey(row);
    if (taken.has(key)) return false;
    taken.add(key);
    return true;
  });
}
