import type { CellValue, DateSeparator } from './types';

export type DateParts = { year: number; month: number; day: number };

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses an ISO `YYYY-MM-DD` date without going through time zones. */
export function parseIsoDate(iso: string): DateParts {
  const match = ISO_DATE.exec(iso);
  if (!match) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }
  return { year, month, day };
}

/** `2025-03-31` → `31-03-2025` (or `31/03/2025` with `/`) */
export function formatDate(iso: string, separator: DateSeparator = '-'): string {
  const { year, month, day } = parseIsoDate(iso);
  return [pad2(day), pad2(month), year].join(separator);
}

/** Number of decimals actually needed to show `value`, up to `max`. */
export function significantDecimals(value: number, max = 3): number {
  const fraction = value.toFixed(max).split('.')[1] ?? '';
  return fraction.replace(/0+$/, '').length;
}

/**
 * Spanish number format: `.` for thousands (also with 4 digits) and `,` for
 * decimals. Does not use Intl: `es-ES` does not group 4-digit numbers and
 * Hermes/ICU output varies between devices.
 */
export function formatNumber(value: number, maxDecimals = 3): string {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid number: ${value}`);
  }
  const decimals = significantDecimals(value, maxDecimals);
  const fixed = Math.abs(value).toFixed(decimals);
  const [integerPart, fractionPart] = fixed.split('.');
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = value < 0 && Number(fixed) !== 0 ? '-' : '';
  return fractionPart ? `${sign}${grouped},${fractionPart}` : `${sign}${grouped}`;
}

/** `{ value: 9340, unit: 'kg' }` → `9.340 kg` */
export function formatQuantity(value: number, unit: string): string {
  const number = formatNumber(value);
  return unit ? `${number} ${unit}` : number;
}

/** Display text for a cell, as shown in the PDF. */
export function formatCell(cell: CellValue, dateSeparator: DateSeparator = '-'): string {
  switch (cell.kind) {
    case 'date':
      return formatDate(cell.iso, dateSeparator);
    case 'quantity':
      return formatQuantity(cell.value, cell.unit);
    case 'text':
      return cell.value ?? '';
  }
}

/** Safe file name: `entradas-alimentos` + `2025` + `pdf` → `entradas-alimentos_2025.pdf` */
export function exportFileName(baseName: string, extension: string, suffix?: string): string {
  const name = suffix ? `${baseName}_${suffix}` : baseName;
  const safe = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${safe || 'export'}.${extension}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
