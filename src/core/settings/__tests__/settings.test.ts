/**
 * @jest-environment node
 */
import { createTestDb } from '../../db/testing/createTestDb';
import { describeLastBackup } from '../lastBackup';
import { getLastBackupAt, getSetting, setLastBackupAt, setSetting } from '../repository';

describe('describeLastBackup', () => {
  const now = new Date(2026, 9, 30, 10, 0);
  const daysAgo = (days: number, hour = 9) => new Date(2026, 9, 30 - days, hour).toISOString();

  it('warns when there has never been a backup', () => {
    expect(describeLastBackup(null, now)).toEqual({
      text: 'Nunca has hecho una copia de seguridad',
      overdue: true,
    });
  });

  it.each([
    [0, 'Última copia: hoy', false],
    [1, 'Última copia: ayer', false],
    [12, 'Última copia: hace 12 días', false],
    [30, 'Última copia: hace 30 días', false],
    [31, 'Última copia: hace 31 días', true],
  ])('%p days ago', (days, text, overdue) => {
    expect(describeLastBackup(daysAgo(days), now)).toEqual({ text, overdue });
  });

  it('counts calendar days, not 24-hour periods', () => {
    expect(describeLastBackup(new Date(2026, 9, 29, 23, 30).toISOString(), now).text).toBe(
      'Última copia: ayer',
    );
  });
});

describe('settings repository', () => {
  it('stores and overwrites values', () => {
    const { db, close } = createTestDb();
    expect(getSetting(db, 'x')).toBeNull();
    setSetting(db, 'x', '1');
    setSetting(db, 'x', '2');
    expect(getSetting(db, 'x')).toBe('2');
    close();
  });

  it('only moves the last backup date forward', () => {
    const { db, close } = createTestDb();
    expect(getLastBackupAt(db)).toBeNull();
    setLastBackupAt(db, '2026-10-01T10:00:00.000Z');
    setLastBackupAt(db, '2026-09-01T10:00:00.000Z');
    expect(getLastBackupAt(db)).toBe('2026-10-01T10:00:00.000Z');
    setLastBackupAt(db, '2026-10-30T10:00:00.000Z');
    expect(getLastBackupAt(db)).toBe('2026-10-30T10:00:00.000Z');
    close();
  });
});
