import * as XLSX from 'xlsx';

import { buildXlsxBase64 } from '@/core/export/excel';
import { formatCell } from '@/core/export/format';
import { buildPdfHtml } from '@/core/export/pdf';
import { sortRows } from '@/core/export/rows';

import { vehicleEntriesTable, type VehicleExportRow } from '../tableDefinition';

const regular = (id: number, plate: string, frequency: string): VehicleExportRow => ({
  kind: 'regular',
  id,
  plate,
  frequency,
  reason: 'Control y cuidado de animales',
  vehicleType: 'private_car',
});

const visit = (id: number, date: string, plate: string): VehicleExportRow => ({
  kind: 'visit',
  id,
  date,
  plate,
  reason: 'Transporte de pienso',
  vehicleType: 'feed_truck',
});

function cells(row: VehicleExportRow) {
  return vehicleEntriesTable.columns.map((column) =>
    formatCell(column.value(row), vehicleEntriesTable.dateSeparator),
  );
}

describe('vehicleEntriesTable', () => {
  it('has the paper form columns, title and orientation', () => {
    expect(vehicleEntriesTable.columns.map((c) => c.header)).toEqual([
      'MATRÍCULA',
      'FECHA',
      'MOTIVO DE VISITA',
      'TIPO DE VEHÍCULO',
    ]);
    expect(vehicleEntriesTable.heading).toEqual([
      'PLAN DE BUENAS PRÁCTICAS EN MEDIDAS DE BIOSEGURIDAD',
      '(Control de entrada de vehículos en la explotación)',
    ]);
    expect(vehicleEntriesTable.orientation).toBe('portrait');
  });

  it('shows the frequency of regular vehicles in the FECHA column', () => {
    expect(cells(regular(1, '6105 HHR', 'A diario'))).toEqual([
      '6105 HHR',
      'A diario',
      'Control y cuidado de animales',
      'Vehículo particular',
    ]);
  });

  it('formats visit dates as dd/mm/aaaa and shows type labels', () => {
    expect(cells(visit(1, '2025-03-05', 'CO-46336-VE'))).toEqual([
      'CO-46336-VE',
      '05/03/2025',
      'Transporte de pienso',
      'Camión de alimento',
    ]);
  });

  it('puts regular vehicles first in creation order, then visits by date', () => {
    const rows = [
      visit(3, '2025-02-01', 'C'),
      regular(2, 'R2', 'Semanalmente'),
      visit(1, '2025-01-15', 'A'),
      regular(1, 'R1', 'A diario'),
      visit(2, '2025-01-15', 'B'),
    ];
    expect(sortRows(vehicleEntriesTable, rows).map((row) => row.plate)).toEqual([
      'R1',
      'R2',
      'A',
      'B',
      'C',
    ]);
  });

  it('prints the heading in the PDF', () => {
    const html = buildPdfHtml(vehicleEntriesTable, [regular(1, 'X', 'A diario')]);
    expect(html).toContain('PLAN DE BUENAS PRÁCTICAS EN MEDIDAS DE BIOSEGURIDAD<br>');
    expect(html).toContain('@page { size: A4 portrait;');
  });

  it('mixes text frequencies and real dates in the Excel FECHA column', () => {
    const base64 = buildXlsxBase64(vehicleEntriesTable, [
      visit(1, '2025-01-31', 'A'),
      regular(1, 'R1', 'A diario'),
    ]);
    const workbook = XLSX.read(base64, { type: 'base64', cellNF: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    expect(sheet.A3.v).toBe('MATRÍCULA');
    expect(sheet.B4).toMatchObject({ t: 's', v: 'A diario' });
    expect(sheet.B5).toMatchObject({ t: 'n', v: 45688, w: '31/01/2025' });
  });
});
