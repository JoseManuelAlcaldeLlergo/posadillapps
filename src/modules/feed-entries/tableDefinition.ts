import type { TableDefinition } from '@/core/export/types';

import type { FeedEntry } from './schema';

export type FeedEntryRow = Pick<
  FeedEntry,
  'id' | 'date' | 'quantity' | 'unit' | 'supplierName' | 'feedName' | 'invoice'
>;

/** Same columns and order as the paper form. */
export const feedEntriesTable: TableDefinition<FeedEntryRow> = {
  id: 'feed-entries',
  title: 'Entradas de alimentos',
  fileBaseName: 'entradas-alimentos',
  orientation: 'landscape',
  columns: [
    {
      key: 'date',
      header: 'FECHA',
      width: 12,
      value: (row) => ({ kind: 'date', iso: row.date }),
    },
    {
      key: 'quantity',
      header: 'CANTIDAD',
      width: 14,
      value: (row) => ({ kind: 'quantity', value: row.quantity, unit: row.unit }),
    },
    {
      key: 'supplier',
      header: 'PROVEEDOR',
      width: 28,
      value: (row) => ({ kind: 'text', value: row.supplierName }),
    },
    {
      key: 'feed',
      header: 'DENOMINACIÓN COMERCIAL DEL PIENSO',
      width: 40,
      value: (row) => ({ kind: 'text', value: row.feedName }),
    },
    {
      key: 'invoice',
      header: 'FACTURA/ALBARÁN',
      width: 18,
      value: (row) => ({ kind: 'text', value: row.invoice }),
    },
  ],
  compareRows: (a, b) => a.date.localeCompare(b.date) || a.id - b.id,
};
