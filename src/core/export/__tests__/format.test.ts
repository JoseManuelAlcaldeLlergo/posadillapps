import {
  exportFileName,
  formatCell,
  formatDate,
  formatNumber,
  formatQuantity,
  parseIsoDate,
} from '../format';

describe('parseIsoDate', () => {
  it('parses valid dates', () => {
    expect(parseIsoDate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
  });

  it.each(['2025-02-29', '2025-13-01', '31-03-2025', '2025-3-1', ''])('rejects %p', (iso) => {
    expect(() => parseIsoDate(iso)).toThrow('Invalid ISO date');
  });
});

describe('formatDate', () => {
  it('formats as dd-mm-yyyy', () => {
    expect(formatDate('2025-03-31')).toBe('31-03-2025');
    expect(formatDate('2025-01-05')).toBe('05-01-2025');
  });
});

describe('formatNumber', () => {
  it.each([
    [0, '0'],
    [7, '7'],
    [999, '999'],
    [9340, '9.340'],
    [1234567, '1.234.567'],
    [1234.5, '1.234,5'],
    [0.25, '0,25'],
    [12.3456, '12,346'],
    [10.0001, '10'],
    [-9340.5, '-9.340,5'],
    [-0.0001, '0'],
  ])('%p → %p', (value, expected) => {
    expect(formatNumber(value)).toBe(expected);
  });

  it('rejects non-finite numbers', () => {
    expect(() => formatNumber(Number.NaN)).toThrow();
    expect(() => formatNumber(Number.POSITIVE_INFINITY)).toThrow();
  });
});

describe('formatQuantity', () => {
  it('appends the unit', () => {
    expect(formatQuantity(9340, 'kg')).toBe('9.340 kg');
    expect(formatQuantity(1.5, 't')).toBe('1,5 t');
  });

  it('omits an empty unit', () => {
    expect(formatQuantity(12, '')).toBe('12');
  });
});

describe('formatCell', () => {
  it('formats each kind', () => {
    expect(formatCell({ kind: 'date', iso: '2025-12-01' })).toBe('01-12-2025');
    expect(formatCell({ kind: 'quantity', value: 25000, unit: 'kg' })).toBe('25.000 kg');
    expect(formatCell({ kind: 'text', value: 'SU 79' })).toBe('SU 79');
    expect(formatCell({ kind: 'text', value: null })).toBe('');
  });
});

describe('exportFileName', () => {
  it('builds a safe file name', () => {
    expect(exportFileName('entradas-alimentos', 'pdf', '2025')).toBe('entradas-alimentos_2025.pdf');
    expect(exportFileName('Tabla ejemplo', 'xlsx', '01-01-2025 a 31-12-2025')).toBe(
      'Tabla-ejemplo_01-01-2025-a-31-12-2025.xlsx',
    );
    expect(exportFileName('Denominación', 'pdf')).toBe('Denominacion.pdf');
    expect(exportFileName('///', 'pdf')).toBe('export.pdf');
  });
});
