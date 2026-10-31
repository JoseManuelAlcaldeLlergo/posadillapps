import * as XLSX from 'xlsx';

import { buildXlsxBase64, excelDateFormat, excelDateSerial, quantityNumberFormat } from '../excel';
import { sampleRows, sampleTable } from './fixtures/sampleTable';

function readBack(base64: string): XLSX.WorkSheet {
  const workbook = XLSX.read(base64, { type: 'base64', cellNF: true, cellStyles: true });
  return workbook.Sheets[workbook.SheetNames[0]];
}

describe('excelDateSerial', () => {
  it('converts ISO dates to Excel serial numbers', () => {
    expect(excelDateSerial('1900-03-01')).toBe(61);
    expect(excelDateSerial('2025-01-31')).toBe(45688);
    expect(excelDateSerial('2025-03-31')).toBe(45747);
  });
});

describe('excelDateFormat', () => {
  it('uses dashes by default and escapes slashes', () => {
    expect(excelDateFormat()).toBe('dd-mm-yyyy');
    expect(excelDateFormat('-')).toBe('dd-mm-yyyy');
    expect(excelDateFormat('/')).toBe('dd\\/mm\\/yyyy');
  });
});

describe('quantityNumberFormat', () => {
  it('uses thousands separator, needed decimals and the unit', () => {
    expect(quantityNumberFormat(9340, 'kg')).toBe('#,##0" kg"');
    expect(quantityNumberFormat(1234.5, 'kg')).toBe('#,##0.0" kg"');
    expect(quantityNumberFormat(0.125, 't')).toBe('#,##0.000" t"');
    expect(quantityNumberFormat(3, '')).toBe('#,##0');
  });
});

describe('buildXlsxBase64', () => {
  const sheet = readBack(buildXlsxBase64(sampleTable, sampleRows));

  it('writes headers in order', () => {
    expect(['A1', 'B1', 'C1', 'D1'].map((ref) => sheet[ref]?.v)).toEqual([
      'FECHA',
      'CANTIDAD',
      'DESCRIPCIÓN',
      'REFERENCIA',
    ]);
    expect(sheet['!ref']).toBe('A1:D4');
  });

  it('writes dates as real Excel dates', () => {
    const cell = sheet.A2;
    expect(cell.t).toBe('n');
    expect(cell.v).toBe(45688);
    expect(cell.z).toBe('dd-mm-yyyy');
    expect(cell.w).toBe('31-01-2025');
  });

  it('writes quantities as numbers', () => {
    expect(sheet.B2).toMatchObject({ t: 'n', v: 1234.5, z: '#,##0.0" kg"' });
    expect(sheet.B3).toMatchObject({ t: 'n', v: 750, z: '#,##0" l"' });
    expect(sheet.B4).toMatchObject({ t: 'n', v: 9340, z: '#,##0" kg"' });
  });

  it('sorts rows and writes text, leaving empty text cells blank', () => {
    expect(['A2', 'A3', 'A4'].map((ref) => sheet[ref].v)).toEqual([45688, 45716, 45747]);
    expect(sheet.C2).toMatchObject({ t: 's', v: 'Producto <B> & C' });
    expect(sheet.D2).toBeUndefined();
    expect(sheet.D4).toMatchObject({ t: 's', v: 'F2000 525' });
  });

  it('sets column widths', () => {
    expect(sheet['!cols']?.map((col) => col.wch)).toEqual([12, 14, 40, 18]);
  });

  it('writes only the header row when there are no rows', () => {
    const empty = readBack(buildXlsxBase64(sampleTable, []));
    expect(empty['!ref']).toBe('A1:D1');
    expect(empty.A1.v).toBe('FECHA');
  });

  it('has no heading or merges by default, with the autofilter on the header row', () => {
    expect(sheet['!merges']).toBeUndefined();
    expect(sheet['!autofilter']?.ref).toBe('A1:D4');
  });

  describe('with a heading', () => {
    const withHeading = readBack(
      buildXlsxBase64({ ...sampleTable, heading: ['PLAN DE EJEMPLO', '(Control de prueba)'] }, sampleRows),
    );

    it('writes heading lines merged across all columns', () => {
      expect(withHeading.A1.v).toBe('PLAN DE EJEMPLO');
      expect(withHeading.A2.v).toBe('(Control de prueba)');
      expect(withHeading['!merges']).toEqual([
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      ]);
    });

    it('moves the header row, the data and the autofilter below the heading', () => {
      expect(withHeading.A3.v).toBe('FECHA');
      expect(withHeading.A4.v).toBe(45688);
      expect(withHeading['!ref']).toBe('A1:D6');
      expect(withHeading['!autofilter']?.ref).toBe('A3:D6');
    });
  });

  it('leaves row heights to Excel by default', () => {
    expect(sheet['!rows']).toBeUndefined();
  });

  it('sets the height of data rows only, below the heading and header', () => {
    const tall = readBack(
      buildXlsxBase64({ ...sampleTable, heading: ['PLAN DE EJEMPLO'], bodyRowHeight: 40 }, sampleRows),
    );
    const rows = tall['!rows'] ?? [];
    expect(rows[0]?.hpt).toBeUndefined();
    expect(rows[1]?.hpt).toBeUndefined();
    expect([rows[2]?.hpt, rows[3]?.hpt, rows[4]?.hpt]).toEqual([40, 40, 40]);
  });

  it('formats dates with the table date separator', () => {
    const slashed = readBack(buildXlsxBase64({ ...sampleTable, dateSeparator: '/' }, sampleRows));
    expect(slashed.A2.v).toBe(45688);
    expect(slashed.A2.w).toBe('31/01/2025');
  });
});
