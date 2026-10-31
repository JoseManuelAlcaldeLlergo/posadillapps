import * as XLSX from 'xlsx';

import { buildXlsxBase64 } from '@/core/export/excel';
import { formatCell } from '@/core/export/format';
import { buildPdfHtml } from '@/core/export/pdf';
import { sortRows } from '@/core/export/rows';
import { SIGNATURE_ROW_HEIGHT } from '@/core/export/types';

import { cleaningDisinfectionTable, type CleaningExportRow } from '../tableDefinition';

const common = {
  farmCode: 'ES140000000000',
  productiveUnit: 'Ovino',
  reviewDate: null,
};

const regular = (id: number, frequency: string, place = 'Bebederos'): CleaningExportRow => ({
  kind: 'regular',
  id,
  frequency,
  productName: 'Agua',
  place,
  waitingDays: 0,
  ...common,
});

const application = (
  id: number,
  date: string,
  overrides: Partial<Extract<CleaningExportRow, { kind: 'application' }>> = {},
): CleaningExportRow => ({
  kind: 'application',
  id,
  date,
  productName: 'Cipergen',
  place: 'Naves, suelo y paredes',
  waitingDays: 15,
  ...common,
  ...overrides,
});

function cells(row: CleaningExportRow) {
  return cleaningDisinfectionTable.columns.map((column) =>
    formatCell(column.value(row), cleaningDisinfectionTable.dateSeparator),
  );
}

describe('cleaningDisinfectionTable', () => {
  it('has the paper form columns, title and orientation', () => {
    expect(cleaningDisinfectionTable.columns.map((c) => c.header)).toEqual([
      'CÓDIGO EXPLOTACIÓN',
      'UNIDAD PRODUCTIVA',
      'FECHA',
      'PRODUCTO EMPLEADO',
      'LUGAR DE APLICACIÓN',
      'PERIODO DE ESPERA',
      'FIRMA DEL RESPONSABLE',
      'FECHA DE REVISIÓN',
    ]);
    expect(cleaningDisinfectionTable.heading).toEqual([
      'PLAN DE LIMPIEZA - DESINFECCIÓN - DESINSECTACIÓN Y DESRATIZACIÓN',
    ]);
    expect(cleaningDisinfectionTable.orientation).toBe('landscape');
    expect(cleaningDisinfectionTable.bodyRowHeight).toBe(SIGNATURE_ROW_HEIGHT);
  });

  it('shows the frequency of regular applications in FECHA, an empty signature and — without review', () => {
    expect(cells(regular(1, 'A diario'))).toEqual([
      'ES140000000000',
      'Ovino',
      'A diario',
      'Agua',
      'Bebederos',
      '0 días',
      '',
      '—',
    ]);
  });

  it('formats dates as dd/mm/aaaa and waiting periods in days', () => {
    expect(cells(application(1, '2025-03-05', { reviewDate: '2025-03-20' }))).toEqual([
      'ES140000000000',
      'Ovino',
      '05/03/2025',
      'Cipergen',
      'Naves, suelo y paredes',
      '15 días',
      '',
      '20/03/2025',
    ]);
    expect(cells(application(2, '2025-03-05', { waitingDays: 1 }))[5]).toBe('1 día');
  });

  it('puts regular applications first in creation order, then applications by date', () => {
    const rows = [
      application(3, '2025-02-01', { place: 'C' }),
      regular(2, 'Semanalmente', 'R2'),
      application(1, '2025-01-15', { place: 'A' }),
      regular(1, 'A diario', 'R1'),
      application(2, '2025-01-15', { place: 'B' }),
    ];
    expect(sortRows(cleaningDisinfectionTable, rows).map((row) => row.place)).toEqual([
      'R1',
      'R2',
      'A',
      'B',
      'C',
    ]);
  });

  it('prints the heading, landscape A4, and leaves room to sign', () => {
    const html = buildPdfHtml(cleaningDisinfectionTable, [regular(1, 'A diario')]);
    expect(html).toContain('PLAN DE LIMPIEZA - DESINFECCIÓN - DESINSECTACIÓN Y DESRATIZACIÓN');
    expect(html).toContain('@page { size: A4 landscape;');
    expect(html).toContain(`tbody td { height: ${SIGNATURE_ROW_HEIGHT}pt; }`);
    expect(html).toContain('—');
  });

  it('mixes frequencies and real dates in the Excel FECHA column and keeps the signature empty', () => {
    const base64 = buildXlsxBase64(cleaningDisinfectionTable, [
      application(1, '2025-01-31', { reviewDate: '2025-02-01' }),
      regular(1, 'A diario'),
    ]);
    const workbook = XLSX.read(base64, { type: 'base64', cellNF: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    expect(sheet.A2.v).toBe('CÓDIGO EXPLOTACIÓN');
    expect(sheet.G2.v).toBe('FIRMA DEL RESPONSABLE');
    expect(sheet.C3).toMatchObject({ t: 's', v: 'A diario' });
    expect(sheet.H3).toMatchObject({ t: 's', v: '—' });
    expect(sheet.C4).toMatchObject({ t: 'n', v: 45688, w: '31/01/2025' });
    expect(sheet.F4).toMatchObject({ t: 'n', v: 15 });
    expect(sheet.G4?.v ?? '').toBe('');
  });
});
