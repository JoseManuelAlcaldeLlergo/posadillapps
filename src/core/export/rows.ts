import type { PeriodType, TableDefinition } from './types';

/** Rows in export order, without mutating the input. */
export function sortRows<Row>(definition: TableDefinition<Row, PeriodType>, rows: readonly Row[]): Row[] {
  const copy = [...rows];
  return definition.compareRows ? copy.sort(definition.compareRows) : copy;
}
