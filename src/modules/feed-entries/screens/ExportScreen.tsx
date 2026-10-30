import type { DateRange } from '@/core/dates';
import { db } from '@/core/db';
import { TableExportScreen } from '@/core/ui';

import { countEntriesInRange, listEntriesInRange } from '../repository';
import { feedEntriesTable } from '../tableDefinition';

const count = (range: DateRange) => countEntriesInRange(db, range);
const load = (range: DateRange) => listEntriesInRange(db, range);
const countMessage = (n: number) => (n === 1 ? '1 entrada en el rango.' : `${n} entradas en el rango.`);

export default function ExportScreen() {
  return (
    <TableExportScreen
      screenTitle="Exportar entradas"
      table={feedEntriesTable}
      count={count}
      load={load}
      countMessage={countMessage}
      emptyMessage="No hay entradas en este rango."
    />
  );
}
