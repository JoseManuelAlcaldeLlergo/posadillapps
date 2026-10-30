import { parseIsoDate } from '../export/format';
import { BackupFormatError } from './types';

/** Generic validators for backup data. `path` names the field in error messages. */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(path: string, expected: string): never {
  throw new BackupFormatError(`Dato no válido en ${path}: se esperaba ${expected}`);
}

export function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) fail(path, 'un objeto');
  return value;
}

export function requireArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, 'una lista');
  return value;
}

export function requireString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim() === '') fail(path, 'un texto');
  return value;
}

export function optionalString(value: unknown, path: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') fail(path, 'un texto o nada');
  return value;
}

export function requireBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') fail(path, 'sí o no (true/false)');
  return value;
}

export function requireNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(path, 'un número');
  return value;
}

export function requireInteger(value: unknown, path: string): number {
  if (!Number.isInteger(value)) fail(path, 'un número entero');
  return value as number;
}

export function optionalInteger(value: unknown, path: string): number | null {
  if (value === null || value === undefined) return null;
  return requireInteger(value, path);
}

/** ISO `YYYY-MM-DD` date. */
export function requireIsoDate(value: unknown, path: string): string {
  if (typeof value !== 'string') fail(path, 'una fecha');
  try {
    parseIsoDate(value);
  } catch {
    fail(path, 'una fecha AAAA-MM-DD');
  }
  return value;
}

/** Throws if two items share the same `id`. */
export function requireUniqueIds(items: readonly { id: number }[], path: string): void {
  const seen = new Set<number>();
  for (const item of items) {
    if (seen.has(item.id)) {
      throw new BackupFormatError(`Dato no válido en ${path}: el id ${item.id} está repetido`);
    }
    seen.add(item.id);
  }
}
