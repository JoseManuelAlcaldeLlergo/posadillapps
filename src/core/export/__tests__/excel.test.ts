import * as XLSX from 'xlsx';

import { buildXlsxBase64, excelDateSerial, quantityNumberFormat } from '../excel';
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
});
