import * as XLSX from 'xlsx';

import { buildXlsxBase64 } from '@/core/export/excel';
import { formatCell } from '@/core/export/format';
import { buildPdfHtml } from '@/core/export/pdf';
import { sortRows } from '@/core/export/rows';
import { SIGNATURE_ROW_HEIGHT } from '@/core/export/types';

import { vehicleCleaningTable, type VehicleCleaningExportRow } from '../tableDefinition';

const periodic = (id: number, year: number, plate: string, reviewText: string | null = null): VehicleCleaningExportRow => ({
  kind: 'regular',
  id,
  year,
  plate,
  plateKey: plate.replace(/[\s-]/g, ''),
  frequency: 'Semanalmente',
  productName: 'Cipergen',
  vehicleType: 'Turismo',
  reviewText,
});

const oneOff = (id: number, date: string, plate = 'CO-46336-VE'): VehicleCleaningExportRow => ({
  kind: 'oneOff',
  id,
  date,
  plate,
  plateKey: plate.replace(/[\s-]/g, ''),
  productName: 'Virkon',
  vehicleType: 'Camión',
  reviewText: null,
});

function cells(row: VehicleCleaningExportRow) {
  return vehicleCleaningTable.columns.map((column) =>
    formatCell(column.value(row), vehicleCleaningTable.dateSeparator),
  );
}

describe('vehicleCleaningTable', () => {
  it('has the paper form columns, title and orientation', () => {
    expect(vehicleCleaningTable.columns.map((c) => c.header)).toEqual([
      'MATRÍCULA',
      'FECHA',
      'PRODUCTO EMPLEADO',
      'TIPO DE VEHÍCULO',
      'FIRMA DEL RESPONSABLE',
      'FECHA DE REVISIÓN',
    ]);
    expect(vehicleCleaningTable.heading).toEqual([
      'PLAN DE LIMPIEZA Y DESINFECCIÓN DE VEHÍCULOS DE LAS EXPLOTACIONES',
    ]);
    expect(vehicleCleaningTable.orientation).toBe('landscape');
    expect(vehicleCleaningTable.periodType ?? 'dateRange').toBe('dateRange');
    expect(vehicleCleaningTable.bodyRowHeight).toBe(SIGNATURE_ROW_HEIGHT);
  });

  it('shows the frequency of periodic cleanings in FECHA, an empty signature and the review text', () => {
    expect(cells(periodic(1, 2023, '6105 HHR', 'Semanalmente 2023'))).toEqual([
      '6105 HHR',
      'Semanalmente',
      'Cipergen',
      'Turismo',
      '',
      'Semanalmente 2023',
    ]);
  });

  it('formats dates as dd/mm/aaaa and an empty review as —', () => {
    expect(cells(oneOff(1, '2023-03-05'))).toEqual(['CO-46336-VE', '05/03/2023', 'Virkon', 'Camión', '', '—']);
  });

  it('puts periodic cleanings first by year and plate, then one-off cleanings by date', () => {
    const rows = [
      oneOff(2, '2024-01-15', 'O2'),
      periodic(3, 2024, 'A 1'),
      oneOff(1, '2023-08-01', 'O1'),
      periodic(2, 2023, 'B 1'),
      periodic(1, 2023, 'A 1'),
      oneOff(3, '2024-01-15', 'O3'),
    ];
    expect(sortRows(vehicleCleaningTable, rows).map((row) => `${row.plate}`)).toEqual([
      'A 1',
      'B 1',
      'A 1',
      'O1',
      'O2',
      'O3',
    ]);
    expect(sortRows(vehicleCleaningTable, rows).slice(0, 3).map((row) => row.kind === 'regular' && row.year)).toEqual([
      2023, 2023, 2024,
    ]);
  });

  it('prints the heading, landscape A4, and leaves room to sign', () => {
    const html = buildPdfHtml(vehicleCleaningTable, [oneOff(1, '2023-03-05')]);
    expect(html).toContain('PLAN DE LIMPIEZA Y DESINFECCIÓN DE VEHÍCULOS DE LAS EXPLOTACIONES');
    expect(html).toContain('@page { size: A4 landscape;');
    expect(html).toContain(`tbody td { height: ${SIGNATURE_ROW_HEIGHT}pt; }`);
    expect(html).toContain('05/03/2023');
  });

  it('mixes frequencies and real dates in the Excel FECHA column and keeps the signature empty', () => {
    const base64 = buildXlsxBase64(vehicleCleaningTable, [
      oneOff(1, '2025-01-31'),
      periodic(1, 2025, '6105 HHR', 'Semanalmente 2025'),
    ]);
    const workbook = XLSX.read(base64, { type: 'base64', cellNF: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    expect(sheet.A2.v).toBe('MATRÍCULA');
    expect(sheet.E2.v).toBe('FIRMA DEL RESPONSABLE');
    expect(sheet.B3).toMatchObject({ t: 's', v: 'Semanalmente' });
    expect(sheet.F3).toMatchObject({ t: 's', v: 'Semanalmente 2025' });
    expect(sheet.B4).toMatchObject({ t: 'n', v: 45688, w: '31/01/2025' });
    expect(sheet.F4).toMatchObject({ t: 's', v: '—' });
    expect(sheet.E4?.v ?? '').toBe('');
  });
});
