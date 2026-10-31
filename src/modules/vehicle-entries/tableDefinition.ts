import type { DateRange } from '@/core/dates';
import type { SyncDatabase } from '@/core/db/types';
import { compareRegularsFirst, regularOrDateCell } from '@/core/export/regulars';
import type { TableDefinition } from '@/core/export/types';

import { countVisitsInRange, listActiveRegulars, listVisitsInRange } from './repository';
import type { VehicleRegular, VehicleVisit } from './schema';
import { VEHICLE_TYPE_LABELS } from './vehicleTypes';

/** A regular vehicle (frequency in the FECHA column) or a visit (real date). */
export type VehicleExportRow =
  | ({ kind: 'regular' } & Pick<VehicleRegular, 'id' | 'plate' | 'frequency' | 'reason' | 'vehicleType'>)
  | ({ kind: 'visit' } & Pick<VehicleVisit, 'id' | 'date' | 'plate' | 'reason' | 'vehicleType'>);

/** Same columns, order and title as the paper form. */
export const vehicleEntriesTable: TableDefinition<VehicleExportRow> = {
  id: 'vehicle-entries',
  title: 'Entrada de vehículos',
  heading: [
    'PLAN DE BUENAS PRÁCTICAS EN MEDIDAS DE BIOSEGURIDAD',
    '(Control de entrada de vehículos en la explotación)',
  ],
  fileBaseName: 'entrada-vehiculos',
  orientation: 'portrait',
  dateSeparator: '/',
  columns: [
    {
      key: 'plate',
      header: 'MATRÍCULA',
      width: 16,
      value: (row) => ({ kind: 'text', value: row.plate }),
    },
    {
      key: 'date',
      header: 'FECHA',
      width: 16,
      align: 'center',
      value: regularOrDateCell,
    },
    {
      key: 'reason',
      header: 'MOTIVO DE VISITA',
      width: 36,
      value: (row) => ({ kind: 'text', value: row.reason }),
    },
    {
      key: 'vehicleType',
      header: 'TIPO DE VEHÍCULO',
      width: 30,
      value: (row) => ({ kind: 'text', value: VEHICLE_TYPE_LABELS[row.vehicleType] }),
    },
  ],
  // Regular vehicles first, in creation order; then visits by date.
  compareRows: compareRegularsFirst,
};

/** Every active regular vehicle plus the visits in the range. */
export function loadExportRows(db: SyncDatabase, range: DateRange): VehicleExportRow[] {
  return [
    ...listActiveRegulars(db).map((regular) => ({ kind: 'regular' as const, ...regular })),
    ...listVisitsInRange(db, range).map((visit) => ({ kind: 'visit' as const, ...visit })),
  ];
}

export function countExportRows(db: SyncDatabase, range: DateRange): number {
  return listActiveRegulars(db).length + countVisitsInRange(db, range);
}
