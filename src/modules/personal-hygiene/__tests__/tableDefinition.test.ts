import { buildPdfHtml } from '@/core/export/pdf';
import { buildXlsxBase64 } from '@/core/export/excel';
import { formatCell } from '@/core/export/format';
import * as XLSX from 'xlsx';

import { personalHygieneTable, SIGNATURE_ROW_HEIGHT, type HygieneExportRow } from '../tableDefinition';

const row: HygieneExportRow = {
  id: 1,
  year: 2013,
  position: 0,
  farmCode: 'ES140000000000',
  productiveUnit: 'Ovino y porcino',
  action: 'Limpieza de manos, botas',
  place: 'Nave',
  result: 'Mensualmente año 2013',
  correctiveMeasures: null,
  dateText: '1 de cada mes 2013',
};

function cells(r: HygieneExportRow) {
  return Object.fromEntries(
    personalHygieneTable.columns.map((column) => [column.header, formatCell(column.value(r))]),
  );
}

describe('personalHygieneTable', () => {
  it('has the paper form columns in order, landscape, by year range', () => {
    expect(personalHygieneTable.columns.map((c) => c.header)).toEqual([
      'CÓDIGO DE EXPLOTACIÓN',
      'UNIDAD PRODUCTIVA',
      'ACTUACIÓN',
      'LUGAR',
      'RESULTADO',
      'MEDIDAS CORRECTORAS',
      'FIRMA DEL RESPONSABLE',
      'FECHA',
    ]);
    expect(personalHygieneTable.orientation).toBe('landscape');
    expect(personalHygieneTable.periodType).toBe('yearRange');
    expect(personalHygieneTable.heading).toEqual([
      'PLAN DE CONTROL DE BUENAS PRÁCTICAS DE HIGIENE PERSONAL',
    ]);
  });

  it('formats each column, with an always empty signature', () => {
    expect(cells({ ...row, correctiveMeasures: 'Ninguna' })).toEqual({
      'CÓDIGO DE EXPLOTACIÓN': 'ES140000000000',
      'UNIDAD PRODUCTIVA': 'Ovino y porcino',
      ACTUACIÓN: 'Limpieza de manos, botas',
      LUGAR: 'Nave',
      RESULTADO: 'Mensualmente año 2013',
      'MEDIDAS CORRECTORAS': 'Ninguna',
      'FIRMA DEL RESPONSABLE': '',
      FECHA: '1 de cada mes 2013',
    });
    expect(cells(row)['MEDIDAS CORRECTORAS']).toBe('');
  });

  it('keeps FECHA as text, since it is a frequency', () => {
    const date = personalHygieneTable.columns.find((c) => c.key === 'dateText');
    expect(date?.value(row)).toEqual({ kind: 'text', value: '1 de cada mes 2013' });
  });

  it('sorts by year, then template order, then creation', () => {
    const rows = [
      { ...row, id: 4, year: 2014, position: 0 },
      { ...row, id: 3, year: 2013, position: 1 },
      { ...row, id: 2, year: 2013, position: 0 },
      { ...row, id: 1, year: 2013, position: 1 },
    ];
    expect([...rows].sort(personalHygieneTable.compareRows).map((r) => r.id)).toEqual([2, 1, 3, 4]);
  });

  it('renders the title and tall rows to sign in the PDF', () => {
    const html = buildPdfHtml(personalHygieneTable, [row]);
    expect(html).toContain('PLAN DE CONTROL DE BUENAS PRÁCTICAS DE HIGIENE PERSONAL');
    expect(html).toContain('<th>FIRMA DEL RESPONSABLE</th>');
    expect(html).toContain(`tbody td { height: ${SIGNATURE_ROW_HEIGHT}pt; }`);
  });

  it('keeps the empty signature column and tall rows in Excel', () => {
    const workbook = XLSX.read(buildXlsxBase64(personalHygieneTable, [row]), { type: 'base64', cellStyles: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    expect(sheet.G2.v).toBe('FIRMA DEL RESPONSABLE');
    expect(sheet.G3).toBeUndefined();
    expect(sheet.H3.v).toBe('1 de cada mes 2013');
    expect(sheet['!ref']).toBe('A1:H3');
    expect(sheet['!rows']?.[2]?.hpt).toBe(SIGNATURE_ROW_HEIGHT);
  });
});
