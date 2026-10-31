export type DateRange = { from: string; to: string };

/** ISO `YYYY-MM-DD` from the local calendar date of `date`. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Local `Date` at midnight for an ISO `YYYY-MM-DD` date. */
export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayIso(now: Date = new Date()): string {
  return toIsoDate(now);
}

/** Years accepted when typed by hand. */
export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;

/** `" 2025 "` → `2025`; null if it is not a 4-digit year between MIN_YEAR and MAX_YEAR. */
export function parseYear(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d{4}$/.test(trimmed)) return null;
  const year = Number(trimmed);
  return year >= MIN_YEAR && year <= MAX_YEAR ? year : null;
}

export type DateRangePreset = {
  id: 'currentYear' | 'previousYear' | 'currentMonth';
  label: string;
  range: (now: Date) => DateRange;
};

export const dateRangePresets: DateRangePreset[] = [
  {
    id: 'currentYear',
    label: 'Año actual',
    range: (now) => yearRange(now.getFullYear()),
  },
  {
    id: 'previousYear',
    label: 'Año anterior',
    range: (now) => yearRange(now.getFullYear() - 1),
  },
  {
    id: 'currentMonth',
    label: 'Mes actual',
    range: (now) => ({
      from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: toIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    }),
  },
];

function yearRange(year: number): DateRange {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/** `2026-10-23` → `Octubre 2026`. */
export function monthTitle(iso: string): string {
  const [year, month] = iso.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** `2026-10-23` → `oct`. Septiembre is `sept`, as the RAE abbreviates it. */
export function monthAbbreviation(iso: string): string {
  const month = Number(iso.split('-')[1]);
  return month === 9 ? 'sept' : MONTH_NAMES[month - 1].slice(0, 3).toLowerCase();
}

export type MonthSection<T> = { key: string; title: string; data: T[] };

/**
 * Splits items already sorted by date into one section per month
 * (`Octubre 2026`), keeping their order. A month that appears again after
 * another one starts a new section.
 */
export function groupByMonth<T>(items: readonly T[], getIsoDate: (item: T) => string): MonthSection<T>[] {
  const sections: MonthSection<T>[] = [];
  for (const item of items) {
    const iso = getIsoDate(item);
    const key = iso.slice(0, 7);
    const last = sections[sections.length - 1];
    if (last?.key === key) last.data.push(item);
    else sections.push({ key, title: monthTitle(iso), data: [item] });
  }
  return sections;
}
