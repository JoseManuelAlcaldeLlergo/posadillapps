import { BackupFormatError } from '../types';
import {
  isRecord,
  optionalInteger,
  optionalString,
  requireArray,
  requireInteger,
  requireIsoDate,
  requireNumber,
  requireRecord,
  requireString,
  requireUniqueIds,
} from '../validate';

function message(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(BackupFormatError);
    return (error as Error).message;
  }
  throw new Error('did not throw');
}

describe('validators', () => {
  it('accept valid values', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(requireRecord({ a: 1 }, 'x')).toEqual({ a: 1 });
    expect(requireArray([1], 'x')).toEqual([1]);
    expect(requireString('a', 'x')).toBe('a');
    expect(optionalString(null, 'x')).toBeNull();
    expect(optionalString(undefined, 'x')).toBeNull();
    expect(optionalString('', 'x')).toBe('');
    expect(requireNumber(1.5, 'x')).toBe(1.5);
    expect(requireInteger(3, 'x')).toBe(3);
    expect(optionalInteger(null, 'x')).toBeNull();
    expect(requireIsoDate('2024-02-29', 'x')).toBe('2024-02-29');
    expect(() => requireUniqueIds([{ id: 1 }, { id: 2 }], 'x')).not.toThrow();
  });

  it('report the field path in Spanish', () => {
    expect(message(() => requireRecord([], 'root'))).toBe('Dato no válido en root: se esperaba un objeto');
    expect(message(() => requireArray({}, 'entries'))).toBe(
      'Dato no válido en entries: se esperaba una lista',
    );
    expect(message(() => requireString('  ', 'entries[0].feedName'))).toBe(
      'Dato no válido en entries[0].feedName: se esperaba un texto',
    );
    expect(message(() => optionalString(5, 'x'))).toBe('Dato no válido en x: se esperaba un texto o nada');
    expect(message(() => requireNumber(Number.NaN, 'x'))).toBe('Dato no válido en x: se esperaba un número');
    expect(message(() => requireInteger(1.5, 'x'))).toBe(
      'Dato no válido en x: se esperaba un número entero',
    );
    expect(message(() => requireIsoDate('2025-02-30', 'entries[3].date'))).toBe(
      'Dato no válido en entries[3].date: se esperaba una fecha AAAA-MM-DD',
    );
    expect(message(() => requireUniqueIds([{ id: 1 }, { id: 1 }], 'feeds'))).toBe(
      'Dato no válido en feeds: el id 1 está repetido',
    );
  });
});
