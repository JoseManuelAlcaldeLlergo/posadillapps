import { formatDecimalInput, parseDecimal } from '../numbers';

describe('parseDecimal', () => {
  it.each([
    ['9340', 9340],
    ['9.340', 9340],
    ['1.234.567', 1234567],
    ['1.234,5', 1234.5],
    ['1234,5', 1234.5],
    ['0,25', 0.25],
    ['1234.5', 1234.5],
    ['12.5', 12.5],
    [' 25 000 ', 25000],
    ['0', 0],
  ])('%p → %p', (text, expected) => {
    expect(parseDecimal(text)).toBe(expected);
  });

  it.each(['', '  ', 'abc', '1,2,3', '12.34.5', '1.23,4', '-5', '1e3', ',5', '5,'])(
    'rejects %p',
    (text) => {
      expect(parseDecimal(text)).toBeNull();
    },
  );
});

describe('formatDecimalInput', () => {
  it('uses a decimal comma without grouping', () => {
    expect(formatDecimalInput(9340)).toBe('9340');
    expect(formatDecimalInput(1234.5)).toBe('1234,5');
  });

  it('round-trips through parseDecimal', () => {
    for (const value of [0.125, 9340, 12500.25]) {
      expect(parseDecimal(formatDecimalInput(value))).toBe(value);
    }
  });
});
