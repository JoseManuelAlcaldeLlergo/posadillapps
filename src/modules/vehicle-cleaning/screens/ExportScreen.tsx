import type { DateRange } from '@/core/dates';
import { db } from '@/core/db';
import { TableExportScreen } from '@/core/ui';

import { countExportRows, loadExportRows, vehicleCleaningTable } from '../tableDefinition';

const count = (range: DateRange) => countExportRows(db, range);
const load = (range: DateRange) => loadExportRows(db, range);
const countMessage = (n: number) =>
  `${n} ${n === 1 ? 'fila' : 'filas'}: las limpiezas periódicas de los años del rango y las puntuales del rango.`;

export default function ExportScreen() {
  return (
    <TableExportScreen
      screenTitle="Exportar limpieza de vehículos"
      table={vehicleCleaningTable}
      count={count}
      load={load}
      countMessage={countMessage}
      emptyMessage="No hay limpiezas periódicas de esos años ni limpiezas puntuales en este rango."
    />
  );
}
