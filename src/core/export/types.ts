import type { DateRange } from '../dates';

/** Typed value of a single cell. Formatting depends on the kind. */
export type CellValue =
  | { kind: 'date'; /** ISO `YYYY-MM-DD` */ iso: string }
  | { kind: 'quantity'; value: number; unit: string }
  | { kind: 'text'; value: string | null };

export type ColumnAlign = 'left' | 'center' | 'right';

export type ColumnDefinition<Row> = {
  key: string;
  /** Header as printed on paper, e.g. `FECHA`. */
  header: string;
  value: (row: Row) => CellValue;
  /** Defaults: date → center, quantity → right, text → left. */
  align?: ColumnAlign;
  /** Width in characters (Excel); also used as relative weight in the PDF. */
  width?: number;
};

export type PageOrientation = 'portrait' | 'landscape';

/** Separator between day, month and year when showing dates. */
export type DateSeparator = '-' | '/';

/** How the user picks the period to export. */
export type PeriodType = 'dateRange' | 'yearRange';

/** Both ends inclusive, e.g. `{ fromYear: 2013, toYear: 2014 }`. */
export type YearRange = { fromYear: number; toYear: number };

/** Period passed to the export screen's `count` and `load` for each period type. */
export type PeriodValue<P extends PeriodType> = P extends 'yearRange' ? YearRange : DateRange;

/** `P` is the period type; the export engine accepts any (`TableDefinition<Row, PeriodType>`). */
export type TableDefinition<Row, P extends PeriodType = 'dateRange'> = {
  id: string;
  /** Document title, sheet name and share dialog title; not printed. */
  title: string;
  /** Lines printed above the table, as on the paper form. */
  heading?: string[];
  /** Defaults to `-` (`31-03-2025`). */
  dateSeparator?: DateSeparator;
  /** Base for exported file names, without extension. */
  fileBaseName: string;
  orientation: PageOrientation;
  columns: ColumnDefinition<Row>[];
  /** Row order in exports. Rows keep their input order if omitted. */
  compareRows?: (a: Row, b: Row) => number;
  /** Period chosen on the export screen. Defaults to `dateRange`. */
  periodType?: P;
  /** Minimum height of data rows in points, e.g. to leave room to sign by hand. */
  bodyRowHeight?: number;
};
