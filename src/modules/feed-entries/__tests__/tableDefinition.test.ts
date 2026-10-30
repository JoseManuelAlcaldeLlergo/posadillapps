import { buildPdfHtml } from '@/core/export/pdf';
import { formatCell } from '@/core/export/format';

import { feedEntriesTable, type FeedEntryRow } from '../tableDefinition';

const row: FeedEntryRow = {
  id: 1,
  date: '2025-03-31',
  quantity: 9340,
  unit: 'kg',
  supplierName: 'Mezclas del Valle',
  feedName: 'Cerdos crecimiento',
  invoice: 'F2000 525',
};

function cells(r: FeedEntryRow) {
  return Object.fromEntries(
    feedEntriesTable.columns.map((column) => [column.header, formatCell(column.value(r))]),
  );
}

describe('feedEntriesTable', () => {
  it('has the paper form columns in order', () => {
    expect(feedEntriesTable.columns.map((c) => c.header)).toEqual([
      'FECHA',
      'CANTIDAD',
      'PROVEEDOR',
      'DENOMINACIÓN COMERCIAL DEL PIENSO',
      'FACTURA/ALBARÁN',
    ]);
    expect(feedEntriesTable.orientation).toBe('landscape');
  });

  it('formats each column', () => {
    expect(cells(row)).toEqual({
      FECHA: '31-03-2025',
      CANTIDAD: '9.340 kg',
      PROVEEDOR: 'Mezclas del Valle',
      'DENOMINACIÓN COMERCIAL DEL PIENSO': 'Cerdos crecimiento',
      'FACTURA/ALBARÁN': 'F2000 525',
    });
  });

  it('formats decimals, other units and a missing invoice', () => {
    expect(cells({ ...row, quantity: 1234.5, unit: 't', invoice: null })).toMatchObject({
      CANTIDAD: '1.234,5 t',
      'FACTURA/ALBARÁN': '',
    });
  });

  it('uses typed cells so Excel gets real dates and numbers', () => {
    const [date, quantity] = feedEntriesTable.columns;
    expect(date.value(row)).toEqual({ kind: 'date', iso: '2025-03-31' });
    expect(quantity.value(row)).toEqual({ kind: 'quantity', value: 9340, unit: 'kg' });
  });

  it('sorts by date ascending, then by creation', () => {
    const rows = [
      { ...row, id: 3, date: '2025-03-31' },
      { ...row, id: 1, date: '2025-01-31' },
      { ...row, id: 2, date: '2025-03-31' },
    ];
    expect([...rows].sort(feedEntriesTable.compareRows).map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it('renders in the PDF', () => {
    const html = buildPdfHtml(feedEntriesTable, [row]);
    expect(html).toContain('<th>DENOMINACIÓN COMERCIAL DEL PIENSO</th>');
    expect(html).toContain('<td class="right">9.340 kg</td>');
  });
});
