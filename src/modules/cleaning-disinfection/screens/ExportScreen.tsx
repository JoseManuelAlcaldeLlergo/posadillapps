import type { DateRange } from '@/core/dates';
import { db } from '@/core/db';
import { TableExportScreen } from '@/core/ui';

import { cleaningDisinfectionTable, countExportRows, loadExportRows } from '../tableDefinition';

const count = (range: DateRange) => countExportRows(db, range);
const load = (range: DateRange) => loadExportRows(db, range);
const countMessage = (n: number) =>
  `${n} ${n === 1 ? 'fila' : 'filas'}: las aplicaciones habituales activas y las aplicaciones del rango.`;

export default function ExportScreen() {
  return (
    <TableExportScreen
      screenTitle="Exportar limpieza y desinfección"
      table={cleaningDisinfectionTable}
      count={count}
      load={load}
      countMessage={countMessage}
      emptyMessage="No hay aplicaciones habituales activas ni aplicaciones en este rango."
    />
  );
}
