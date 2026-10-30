import type { DateRange } from '@/core/dates';
import { db } from '@/core/db';
import { TableExportScreen } from '@/core/ui';

import { countExportRows, loadExportRows, vehicleEntriesTable } from '../tableDefinition';

const count = (range: DateRange) => countExportRows(db, range);
const load = (range: DateRange) => loadExportRows(db, range);
const countMessage = (n: number) =>
  `${n} ${n === 1 ? 'fila' : 'filas'}: los vehículos habituales activos y las visitas del rango.`;

export default function ExportScreen() {
  return (
    <TableExportScreen
      screenTitle="Exportar vehículos"
      table={vehicleEntriesTable}
      count={count}
      load={load}
      countMessage={countMessage}
      emptyMessage="No hay vehículos habituales activos ni visitas en este rango."
    />
  );
}
