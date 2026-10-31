import type { DateRange } from '@/core/dates';
import type { SyncDatabase } from '@/core/db/types';
import { isRegularRow, regularOrDateCell } from '@/core/export/regulars';
import { SIGNATURE_ROW_HEIGHT, type TableDefinition } from '@/core/export/types';

import {
  countOneOffsInRange,
  countPeriodicInYears,
  listOneOffsInRange,
  listPeriodicInYears,
  yearsOfRange,
} from './repository';
import type { OneOffCleaning, PeriodicCleaning } from './schema';

type ExportFields = 'id' | 'plate' | 'plateKey' | 'productName' | 'vehicleType' | 'reviewText';

/** A periodic cleaning (frequency in the FECHA column) or a one-off cleaning (real date). */
export type VehicleCleaningExportRow =
  | ({ kind: 'regular' } & Pick<PeriodicCleaning, ExportFields | 'frequency' | 'year'>)
  | ({ kind: 'oneOff' } & Pick<OneOffCleaning, ExportFields | 'date'>);

/** Printed in FECHA DE REVISIÓN when there is none, as on the paper form. */
export const NO_REVIEW_TEXT = '—';

/** Periodic cleanings first, by year and plate; then one-off cleanings by date. */
export function compareExportRows(a: VehicleCleaningExportRow, b: VehicleCleaningExportRow): number {
  if (isRegularRow(a) !== isRegularRow(b)) return isRegularRow(a) ? -1 : 1;
  if (a.kind === 'regular' && b.kind === 'regular') {
    return a.year - b.year || a.plateKey.localeCompare(b.plateKey) || a.id - b.id;
  }
  if (a.kind === 'oneOff' && b.kind === 'oneOff') return a.date.localeCompare(b.date) || a.id - b.id;
  return 0;
}

/** Same columns, order and title as the paper form, with an empty signature column. */
export const vehicleCleaningTable: TableDefinition<VehicleCleaningExportRow> = {
  id: 'vehicle-cleaning',
  title: 'Limpieza de vehículos',
  heading: ['PLAN DE LIMPIEZA Y DESINFECCIÓN DE VEHÍCULOS DE LAS EXPLOTACIONES'],
  fileBaseName: 'limpieza-vehiculos',
  orientation: 'landscape',
  dateSeparator: '/',
  bodyRowHeight: SIGNATURE_ROW_HEIGHT,
  columns: [
    {
      key: 'plate',
      header: 'MATRÍCULA',
      width: 20,
      value: (row) => ({ kind: 'text', value: row.plate }),
    },
    {
      key: 'date',
      header: 'FECHA',
      width: 14,
      align: 'center',
      value: regularOrDateCell,
    },
    {
      key: 'productName',
      header: 'PRODUCTO EMPLEADO',
      width: 20,
      value: (row) => ({ kind: 'text', value: row.productName }),
    },
    {
      key: 'vehicleType',
      header: 'TIPO DE VEHÍCULO',
      width: 16,
      value: (row) => ({ kind: 'text', value: row.vehicleType }),
    },
    {
      key: 'signature',
      header: 'FIRMA DEL RESPONSABLE',
      width: 22,
      value: () => ({ kind: 'text', value: null }),
    },
    {
      key: 'reviewText',
      header: 'FECHA DE REVISIÓN',
      width: 18,
      align: 'center',
      value: (row) => ({ kind: 'text', value: row.reviewText ?? NO_REVIEW_TEXT }),
    },
  ],
  compareRows: compareExportRows,
};

/** Periodic cleanings of the years the range touches, plus the one-off cleanings in the range. */
export function loadExportRows(db: SyncDatabase, range: DateRange): VehicleCleaningExportRow[] {
  return [
    ...listPeriodicInYears(db, yearsOfRange(range)).map((row) => ({ kind: 'regular' as const, ...row })),
    ...listOneOffsInRange(db, range).map((row) => ({ kind: 'oneOff' as const, ...row })),
  ];
}

export function countExportRows(db: SyncDatabase, range: DateRange): number {
  return countPeriodicInYears(db, yearsOfRange(range)) + countOneOffsInRange(db, range);
}
