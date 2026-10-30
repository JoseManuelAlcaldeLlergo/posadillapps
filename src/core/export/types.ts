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

export type TableDefinition<Row> = {
  id: string;
  title: string;
  /** Base for exported file names, without extension. */
  fileBaseName: string;
  orientation: PageOrientation;
  columns: ColumnDefinition<Row>[];
  /** Row order in exports. Rows keep their input order if omitted. */
  compareRows?: (a: Row, b: Row) => number;
};
