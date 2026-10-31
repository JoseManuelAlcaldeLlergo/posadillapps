import { db } from '@/core/db';
import type { YearRange } from '@/core/export/types';
import { TableExportScreen } from '@/core/ui';

import { countRecordsInYearRange, listRecordsInYearRange } from '../repository';
import { personalHygieneTable } from '../tableDefinition';

const count = (range: YearRange) => countRecordsInYearRange(db, range);
const load = (range: YearRange) => listRecordsInYearRange(db, range);
const countMessage = (n: number) => (n === 1 ? '1 fila en el rango.' : `${n} filas en el rango.`);

export default function ExportScreen() {
  return (
    <TableExportScreen
      screenTitle="Exportar higiene personal"
      table={personalHygieneTable}
      count={count}
      load={load}
      countMessage={countMessage}
      emptyMessage="No hay filas en estos años."
    />
  );
}
