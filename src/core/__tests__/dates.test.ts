import { dateRangePresets, fromIsoDate, parseYear, toIsoDate, todayIso } from '../dates';

function preset(id: string) {
  const found = dateRangePresets.find((p) => p.id === id);
  if (!found) throw new Error(id);
  return found;
}

describe('toIsoDate / fromIsoDate', () => {
  it('uses the local calendar date', () => {
    expect(toIsoDate(new Date(2025, 0, 5, 23, 59))).toBe('2025-01-05');
    expect(toIsoDate(fromIsoDate('2024-02-29'))).toBe('2024-02-29');
  });

  it('returns today', () => {
    expect(todayIso(new Date(2025, 11, 31, 8))).toBe('2025-12-31');
  });
});

describe('dateRangePresets', () => {
  const now = new Date(2025, 1, 14);

  it('has the labels in order', () => {
    expect(dateRangePresets.map((p) => p.label)).toEqual(['Año actual', 'Año anterior', 'Mes actual']);
  });

  it('computes the current and previous year', () => {
    expect(preset('currentYear').range(now)).toEqual({ from: '2025-01-01', to: '2025-12-31' });
    expect(preset('previousYear').range(now)).toEqual({ from: '2024-01-01', to: '2024-12-31' });
  });

  it('computes the current month, including leap years', () => {
    expect(preset('currentMonth').range(now)).toEqual({ from: '2025-02-01', to: '2025-02-28' });
    expect(preset('currentMonth').range(new Date(2024, 1, 1))).toEqual({
      from: '2024-02-01',
      to: '2024-02-29',
    });
    expect(preset('currentMonth').range(new Date(2025, 11, 31))).toEqual({
      from: '2025-12-01',
      to: '2025-12-31',
    });
  });
});

describe('parseYear', () => {
  it('parses 4-digit years, ignoring spaces', () => {
    expect(parseYear('2025')).toBe(2025);
    expect(parseYear(' 2013 ')).toBe(2013);
  });

  it('rejects partial, non-numeric and out-of-range years', () => {
    expect(parseYear('')).toBeNull();
    expect(parseYear('20')).toBeNull();
    expect(parseYear('20a5')).toBeNull();
    expect(parseYear('2025.5')).toBeNull();
    expect(parseYear('1899')).toBeNull();
    expect(parseYear('2101')).toBeNull();
  });
});
