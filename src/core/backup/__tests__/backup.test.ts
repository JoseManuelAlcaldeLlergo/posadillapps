/**
 * @jest-environment node
 */
import { like, sql } from 'drizzle-orm';

import { createTestDb } from '../../db/testing/createTestDb';
import type { SyncDatabase } from '../../db/types';
import { appSettings } from '../../settings/schema';
import { getSetting, setSetting } from '../../settings/repository';
import {
  createBackup,
  describeBackup,
  parseBackupFile,
  restoreBackup,
  serializeBackup,
} from '../backup';
import { BackupFormatError, defineModuleBackup, type BackupParticipant } from '../types';
import { requireArray, requireString } from '../validate';

/** Fake module storing a list of strings in app_settings under `prefix:i`. */
function fakeModule(id: string, calls: string[] = [], failRestore = false): BackupParticipant {
  const prefix = `${id}:`;
  return {
    id,
    title: id.toUpperCase(),
    backup: defineModuleBackup<string[]>({
      version: 2,
      export: (db) =>
        db
          .select()
          .from(appSettings)
          .where(like(appSettings.key, `${prefix}%`))
          .all()
          .map((row: { value: string }) => row.value),
      parse: (data, version) => {
        if (data === undefined) return [];
        const items = requireArray(data, id).map((v, i) => requireString(v, `${id}[${i}]`));
        return version < 2 ? items.map((v) => v.toUpperCase()) : items;
      },
      clear: (tx) => {
        calls.push(`clear ${id}`);
        tx.delete(appSettings).where(like(appSettings.key, `${prefix}%`)).run();
      },
      restore: (tx, data) => {
        calls.push(`restore ${id}`);
        if (failRestore) throw new Error('boom');
        data.forEach((value, i) => setSetting(tx, `${prefix}${i}`, value));
      },
      summary: (data) => `${data.length} notas`,
    }),
  };
}

function seed(db: SyncDatabase, id: string, values: string[]) {
  values.forEach((value, i) => setSetting(db, `${id}:${i}`, value));
}

let db: SyncDatabase;
let close: () => void;
beforeEach(() => ({ db, close } = createTestDb()));
afterEach(() => close());

describe('createBackup / parseBackupFile', () => {
  const modules = [fakeModule('a'), fakeModule('b'), { id: 'no-backup', title: 'X' }];

  it('round-trips through JSON', () => {
    seed(db, 'a', ['uno', 'dos']);
    seed(db, 'b', ['tres']);
    const file = createBackup(db, modules, new Date('2026-10-30T10:00:00Z'));

    expect(file).toEqual({
      app: 'posadillapps',
      format: 1,
      createdAt: '2026-10-30T10:00:00.000Z',
      modules: { a: { version: 2, data: ['uno', 'dos'] }, b: { version: 2, data: ['tres'] } },
    });
    expect(describeBackup(file, modules)).toEqual([
      { id: 'a', title: 'A', summary: '2 notas' },
      { id: 'b', title: 'B', summary: '1 notas' },
    ]);

    const contents = parseBackupFile(serializeBackup(file), modules);
    expect(contents.createdAt).toBe('2026-10-30T10:00:00.000Z');
    expect(contents.modules).toEqual([
      { id: 'a', title: 'A', data: ['uno', 'dos'], summary: '2 notas' },
      { id: 'b', title: 'B', data: ['tres'], summary: '1 notas' },
    ]);
  });

  it('passes older module versions to parse', () => {
    const text = JSON.stringify({
      app: 'posadillapps',
      format: 1,
      createdAt: '2026-01-01T00:00:00Z',
      modules: { a: { version: 1, data: ['uno'] } },
    });
    expect(parseBackupFile(text, modules).modules[0].data).toEqual(['UNO']);
  });

  it('treats modules missing from the file as empty', () => {
    const text = JSON.stringify({
      app: 'posadillapps',
      format: 1,
      createdAt: '2026-01-01T00:00:00Z',
      modules: { a: { version: 2, data: ['uno'] } },
    });
    expect(parseBackupFile(text, modules).modules[1]).toEqual({
      id: 'b',
      title: 'B',
      data: [],
      summary: '0 notas',
    });
  });

  const valid = { app: 'posadillapps', format: 1, createdAt: '2026-01-01T00:00:00Z', modules: {} };

  it.each([
    ['not JSON', 'esto no es json', 'El archivo no es una copia de seguridad de PosadillApps'],
    ['another app', JSON.stringify({ ...valid, app: 'otra' }), 'El archivo no es una copia de seguridad de PosadillApps'],
    ['no date', JSON.stringify({ ...valid, createdAt: 'ayer' }), 'El archivo no es una copia de seguridad de PosadillApps'],
    ['newer format', JSON.stringify({ ...valid, format: 2 }), 'La copia es de una versión más nueva de la app'],
    [
      'unknown module',
      JSON.stringify({ ...valid, modules: { zz: { version: 1, data: [] } } }),
      'La copia es de una versión más nueva de la app',
    ],
    [
      'newer module version',
      JSON.stringify({ ...valid, modules: { a: { version: 3, data: [] } } }),
      'La copia es de una versión más nueva de la app',
    ],
    [
      'invalid module data',
      JSON.stringify({ ...valid, modules: { a: { version: 2, data: [1] } } }),
      'Dato no válido en a[0]: se esperaba un texto',
    ],
  ])('rejects %s', (_label, text, message) => {
    const run = () => parseBackupFile(text, modules);
    expect(run).toThrow(BackupFormatError);
    expect(run).toThrow(message);
  });
});

describe('restoreBackup', () => {
  it('replaces data, clearing in reverse order', () => {
    const calls: string[] = [];
    const modules = [fakeModule('a', calls), fakeModule('b', calls)];
    seed(db, 'a', ['viejo-1', 'viejo-2', 'viejo-3']);
    seed(db, 'b', ['viejo']);

    const contents = parseBackupFile(
      JSON.stringify({
        app: 'posadillapps',
        format: 1,
        createdAt: '2026-01-01T00:00:00Z',
        modules: { a: { version: 2, data: ['nuevo'] } },
      }),
      modules,
    );
    restoreBackup(db, contents, modules);

    expect(calls).toEqual(['clear b', 'clear a', 'restore a', 'restore b']);
    expect(createBackup(db, modules).modules).toEqual({
      a: { version: 2, data: ['nuevo'] },
      b: { version: 2, data: [] },
    });
  });

  it('changes nothing if a module fails to restore', () => {
    const modules = [fakeModule('a'), fakeModule('b', [], true)];
    seed(db, 'a', ['se queda']);
    seed(db, 'b', ['se queda']);
    const contents = parseBackupFile(
      serializeBackup({
        app: 'posadillapps',
        format: 1,
        createdAt: '2026-01-01T00:00:00Z',
        modules: { a: { version: 2, data: ['x'] }, b: { version: 2, data: ['y'] } },
      }),
      modules,
    );

    expect(() => restoreBackup(db, contents, modules)).toThrow('boom');
    expect(getSetting(db, 'a:0')).toBe('se queda');
    expect(getSetting(db, 'b:0')).toBe('se queda');
  });

  describe('with a module referencing one registered after it', () => {
    type Ids = number[];

    /** Module whose rows live in its own table; `children` reference `parents`. */
    function tableModule(id: 'parents' | 'children'): BackupParticipant {
      return {
        id,
        title: id,
        backup: defineModuleBackup<Ids>({
          version: 1,
          export: (db) =>
            db.all<{ id: number }>(sql.raw(`select id from test_${id} order by id`)).map((r) => r.id),
          parse: (data) => (data === undefined ? [] : (data as Ids)),
          clear: (tx) => tx.run(sql.raw(`delete from test_${id}`)),
          restore: (tx, ids) =>
            ids.forEach((rowId) =>
              tx.run(
                id === 'parents'
                  ? sql`insert into test_parents (id) values (${rowId})`
                  : sql`insert into test_children (id, parent_id) values (${rowId}, ${rowId})`,
              ),
            ),
          summary: (ids) => `${ids.length}`,
        }),
      };
    }

    // Children first: they are restored before the parents they reference.
    const modules = [tableModule('children'), tableModule('parents')];

    beforeEach(() => {
      db.run(sql`create table test_parents (id integer primary key)`);
      db.run(sql`create table test_children (
        id integer primary key,
        parent_id integer not null references test_parents(id)
      )`);
    });

    function contentsWith(children: Ids, parents: Ids) {
      return parseBackupFile(
        serializeBackup({
          app: 'posadillapps',
          format: 1,
          createdAt: '2026-01-01T00:00:00Z',
          modules: { children: { version: 1, data: children }, parents: { version: 1, data: parents } },
        }),
        modules,
      );
    }

    it('restores because foreign keys are checked at commit', () => {
      restoreBackup(db, contentsWith([1, 2], [1, 2]), modules);
      expect(createBackup(db, modules).modules).toEqual({
        children: { version: 1, data: [1, 2] },
        parents: { version: 1, data: [1, 2] },
      });
    });

    it('still rejects broken references and changes nothing', () => {
      restoreBackup(db, contentsWith([1], [1]), modules);
      expect(() => restoreBackup(db, contentsWith([1, 2], [1]), modules)).toThrow(/FOREIGN KEY/);
      expect(createBackup(db, modules).modules.children.data).toEqual([1]);
    });
  });
});
