import * as XLSX from 'xlsx';

import { parseIsoDate, significantDecimals } from './format';
import { sortRows } from './rows';
import type { CellValue, TableDefinition } from './types';

const DEFAULT_WIDTH = 15;
const MS_PER_DAY = 86_400_000;
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

export const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const EXCEL_DATE_FORMAT = 'dd-mm-yyyy';

/** Excel serial number for an ISO date (days since 1899-12-30, no time zone). */
export function excelDateSerial(iso: string): number {
  const { year, month, day } = parseIsoDate(iso);
  return (Date.UTC(year, month - 1, day) - EXCEL_EPOCH) / MS_PER_DAY;
}

/** Excel number format for a quantity: thousands separator, needed decimals, unit. */
export function quantityNumberFormat(value: number, unit: string): string {
  const decimals = significantDecimals(value);
  const number = decimals > 0 ? `#,##0.${'0'.repeat(decimals)}` : '#,##0';
  return unit ? `${number}" ${unit.replace(/"/g, '')}"` : number;
}

/** Workbook with one sheet: header row + one row per record, with real dates and numbers. */
export function buildWorkbook<Row>(definition: TableDefinition<Row>, rows: readonly Row[]): XLSX.WorkBook {
  const { columns } = definition;
  const sheet: XLSX.WorkSheet = {};

  columns.forEach((column, c) => {
    sheet[XLSX.utils.encode_cell({ r: 0, c })] = { t: 's', v: column.header };
  });

  const sorted = sortRows(definition, rows);
  sorted.forEach((row, index) => {
    columns.forEach((column, c) => {
      const cell = toSheetCell(column.value(row));
      if (cell) {
        sheet[XLSX.utils.encode_cell({ r: index + 1, c })] = cell;
      }
    });
  });

  const range = { s: { r: 0, c: 0 }, e: { r: sorted.length, c: Math.max(columns.length - 1, 0) } };
  sheet['!ref'] = XLSX.utils.encode_range(range);
  sheet['!autofilter'] = { ref: sheet['!ref'] };
  sheet['!cols'] = columns.map((column) => ({ wch: column.width ?? DEFAULT_WIDTH }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName(definition.title));
  return workbook;
}

/** `.xlsx` file contents encoded in base64. */
export function buildXlsxBase64<Row>(definition: TableDefinition<Row>, rows: readonly Row[]): string {
  return XLSX.write(buildWorkbook(definition, rows), { type: 'base64', bookType: 'xlsx' });
}

function toSheetCell(cell: CellValue): XLSX.CellObject | undefined {
  switch (cell.kind) {
    case 'date':
      return { t: 'n', v: excelDateSerial(cell.iso), z: EXCEL_DATE_FORMAT };
    case 'quantity':
      return { t: 'n', v: cell.value, z: quantityNumberFormat(cell.value, cell.unit) };
    case 'text':
      return cell.value ? { t: 's', v: cell.value } : undefined;
  }
}

/** Excel sheet names: max 31 chars, without `[]:*?/\`. */
function sheetName(title: string): string {
  return title.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || 'Hoja1';
}
