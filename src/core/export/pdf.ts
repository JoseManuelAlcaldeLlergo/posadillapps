import { formatCell } from './format';
import { sortRows } from './rows';
import type {
  CellValue,
  ColumnAlign,
  ColumnDefinition,
  PageOrientation,
  PeriodType,
  TableDefinition,
} from './types';

const DEFAULT_WIDTH = 15;

/** A4 size in PostScript points (1/72 in), as expected by expo-print. */
export function pageSize(orientation: PageOrientation): { width: number; height: number } {
  return orientation === 'landscape' ? { width: 842, height: 595 } : { width: 595, height: 842 };
}

/**
 * Printable HTML for a table: A4, borders on every cell, bold centered
 * headers repeated on each page. The optional heading repeats too.
 * `bodyRowHeight` sets the minimum height of data rows.
 */
export function buildPdfHtml<Row>(
  definition: TableDefinition<Row, PeriodType>,
  rows: readonly Row[],
): string {
  const { columns, dateSeparator } = definition;
  const totalWidth = columns.reduce((sum, column) => sum + (column.width ?? DEFAULT_WIDTH), 0);

  const colgroup = columns
    .map((column) => {
      const percent = (((column.width ?? DEFAULT_WIDTH) / totalWidth) * 100).toFixed(2);
      return `<col style="width:${percent}%">`;
    })
    .join('');

  const header = columns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join('');
  // Inside thead so it repeats on every page, like the column headers.
  const heading = definition.heading?.length
    ? `<tr><th class="heading" colspan="${columns.length}">${definition.heading
        .map(escapeHtml)
        .join('<br>')}</th></tr>`
    : '';

  const body = sortRows(definition, rows)
    .map((row) => {
      const cells = columns
        .map((column) => {
          const cell = column.value(row);
          const align = cellAlign(column, cell);
          return `<td class="${align}">${escapeHtml(formatCell(cell, dateSeparator))}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('\n');

  const rowHeight = definition.bodyRowHeight
    ? `\ntbody td { height: ${definition.bodyRowHeight}pt; }`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${escapeHtml(definition.title)}</title>
<style>
@page { size: A4 ${definition.orientation}; margin: 12mm; }
html, body { margin: 0; padding: 0; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
thead { display: table-header-group; }
tr { page-break-inside: avoid; break-inside: avoid; }
th, td { border: 1px solid #000; padding: 4px 6px; overflow-wrap: anywhere; vertical-align: middle; }
th { font-weight: bold; text-align: center; }
th.heading { border: none; padding: 0 0 8px; font-size: 11pt; }
td.left { text-align: left; }
td.center { text-align: center; }
td.right { text-align: right; }${rowHeight}
</style>
</head>
<body>
<table>
<colgroup>${colgroup}</colgroup>
<thead>${heading}<tr>${header}</tr></thead>
<tbody>
${body}
</tbody>
</table>
</body>
</html>`;
}

function cellAlign<Row>(column: ColumnDefinition<Row>, cell: CellValue): ColumnAlign {
  if (column.align) return column.align;
  switch (cell.kind) {
    case 'date':
      return 'center';
    case 'quantity':
      return 'right';
    case 'text':
      return 'left';
  }
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
