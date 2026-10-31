import type { DateRange } from '@/core/dates';
import type { SyncDatabase } from '@/core/db/types';
import { compareRegularsFirst, regularOrDateCell } from '@/core/export/regulars';
import { SIGNATURE_ROW_HEIGHT, type TableDefinition } from '@/core/export/types';

import { countApplicationsInRange, listActiveRegulars, listApplicationsInRange } from './repository';
import type { CleaningApplication, CleaningRegular } from './schema';
import { waitingDaysUnit } from './waitingPeriod';

type ExportFields = 'id' | 'farmCode' | 'productiveUnit' | 'productName' | 'place' | 'waitingDays' | 'reviewDate';

/** A regular application (frequency in the FECHA column) or an application (real date). */
export type CleaningExportRow =
  | ({ kind: 'regular' } & Pick<CleaningRegular, ExportFields | 'frequency'>)
  | ({ kind: 'application' } & Pick<CleaningApplication, ExportFields | 'date'>);

/** Printed in FECHA DE REVISIÓN when there is none, as on the paper form. */
export const NO_REVIEW_DATE = '—';

/** Same columns, order and title as the paper form, with an empty signature column. */
export const cleaningDisinfectionTable: TableDefinition<CleaningExportRow> = {
  id: 'cleaning-disinfection',
  title: 'Limpieza y desinfección',
  heading: ['PLAN DE LIMPIEZA - DESINFECCIÓN - DESINSECTACIÓN Y DESRATIZACIÓN'],
  fileBaseName: 'limpieza-desinfeccion',
  orientation: 'landscape',
  dateSeparator: '/',
  bodyRowHeight: SIGNATURE_ROW_HEIGHT,
  columns: [
    {
      key: 'farmCode',
      header: 'CÓDIGO EXPLOTACIÓN',
      width: 16,
      value: (row) => ({ kind: 'text', value: row.farmCode }),
    },
    {
      key: 'productiveUnit',
      header: 'UNIDAD PRODUCTIVA',
      width: 14,
      value: (row) => ({ kind: 'text', value: row.productiveUnit }),
    },
    {
      key: 'date',
      header: 'FECHA',
      width: 13,
      align: 'center',
      value: regularOrDateCell,
    },
    {
      key: 'productName',
      header: 'PRODUCTO EMPLEADO',
      width: 18,
      value: (row) => ({ kind: 'text', value: row.productName }),
    },
    {
      key: 'place',
      header: 'LUGAR DE APLICACIÓN',
      width: 22,
      value: (row) => ({ kind: 'text', value: row.place }),
    },
    {
      key: 'waitingDays',
      header: 'PERIODO DE ESPERA',
      width: 11,
      align: 'center',
      value: (row) => ({ kind: 'quantity', value: row.waitingDays, unit: waitingDaysUnit(row.waitingDays) }),
    },
    {
      key: 'signature',
      header: 'FIRMA DEL RESPONSABLE',
      width: 20,
      value: () => ({ kind: 'text', value: null }),
    },
    {
      key: 'reviewDate',
      header: 'FECHA DE REVISIÓN',
      width: 13,
      align: 'center',
      value: (row) =>
        row.reviewDate ? { kind: 'date', iso: row.reviewDate } : { kind: 'text', value: NO_REVIEW_DATE },
    },
  ],
  // Regular applications first, in creation order; then applications by date.
  compareRows: compareRegularsFirst,
};

/** Every active regular application plus the applications in the range. */
export function loadExportRows(db: SyncDatabase, range: DateRange): CleaningExportRow[] {
  return [
    ...listActiveRegulars(db).map((regular) => ({ kind: 'regular' as const, ...regular })),
    ...listApplicationsInRange(db, range).map((application) => ({
      kind: 'application' as const,
      ...application,
    })),
  ];
}

export function countExportRows(db: SyncDatabase, range: DateRange): number {
  return listActiveRegulars(db).length + countApplicationsInRange(db, range);
}
