import type { TableDefinition } from '../../types';

/** Generic example table, not tied to any real module. */
export type SampleRow = {
  date: string;
  amount: number;
  unit: string;
  description: string;
  reference: string | null;
};

export const sampleTable: TableDefinition<SampleRow> = {
  id: 'sample',
  title: 'Tabla de ejemplo',
  fileBaseName: 'tabla-ejemplo',
  orientation: 'landscape',
  columns: [
    { key: 'date', header: 'FECHA', width: 12, value: (row) => ({ kind: 'date', iso: row.date }) },
    {
      key: 'amount',
      header: 'CANTIDAD',
      width: 14,
      value: (row) => ({ kind: 'quantity', value: row.amount, unit: row.unit }),
    },
    {
      key: 'description',
      header: 'DESCRIPCIÓN',
      width: 40,
      value: (row) => ({ kind: 'text', value: row.description }),
    },
    {
      key: 'reference',
      header: 'REFERENCIA',
      width: 18,
      value: (row) => ({ kind: 'text', value: row.reference }),
    },
  ],
  compareRows: (a, b) => a.date.localeCompare(b.date),
};

/** Deliberately out of date order. */
export const sampleRows: SampleRow[] = [
  { date: '2025-03-31', amount: 9340, unit: 'kg', description: 'Producto A', reference: 'F2000 525' },
  { date: '2025-01-31', amount: 1234.5, unit: 'kg', description: 'Producto <B> & C', reference: null },
  { date: '2025-02-28', amount: 750, unit: 'l', description: 'Producto D', reference: 'SU 79' },
];
