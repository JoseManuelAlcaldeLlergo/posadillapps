import { asc } from 'drizzle-orm';

import { BackupFormatError, defineModuleBackup, type BackupParticipant } from '../backup/types';
import {
  optionalString,
  requireArray,
  requireInteger,
  requireRecord,
  requireString,
  requireUniqueIds,
} from '../backup/validate';
import type { SyncDatabase } from '../db/types';
import { farmSettings, productiveUnits, type ProductiveUnit } from './schema';

export type FarmBackupData = {
  farmCode: string | null;
  productiveUnits: ProductiveUnit[];
};

function parseUnit(value: unknown, path: string): ProductiveUnit {
  const row = requireRecord(value, path);
  return {
    id: requireInteger(row.id, `${path}.id`),
    name: requireString(row.name, `${path}.name`),
    nameKey: requireString(row.nameKey, `${path}.nameKey`),
    sortOrder: requireInteger(row.sortOrder, `${path}.sortOrder`),
    createdAt: requireString(row.createdAt, `${path}.createdAt`),
  };
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

const farmBackup = defineModuleBackup<FarmBackupData>({
  version: 1,

  export: (db: SyncDatabase) => ({
    farmCode: db.select().from(farmSettings).get()?.farmCode ?? null,
    productiveUnits: db.select().from(productiveUnits).orderBy(asc(productiveUnits.id)).all(),
  }),

  parse: (data) => {
    if (data === undefined) return { farmCode: null, productiveUnits: [] };
    const root = requireRecord(data, 'farm');
    const farmCode = optionalString(root.farmCode, 'farmCode');
    const units = requireArray(root.productiveUnits, 'productiveUnits').map((row, i) =>
      parseUnit(row, `productiveUnits[${i}]`),
    );
    requireUniqueIds(units, 'productiveUnits');
    const keys = new Set<string>();
    units.forEach((unit, i) => {
      if (keys.has(unit.nameKey)) {
        throw new BackupFormatError(`Dato no válido en productiveUnits[${i}].name: está repetida`);
      }
      keys.add(unit.nameKey);
    });
    return { farmCode: farmCode || null, productiveUnits: units };
  },

  clear: (tx) => {
    tx.delete(productiveUnits).run();
    tx.delete(farmSettings).run();
  },

  restore: (tx, data) => {
    if (data.farmCode) tx.insert(farmSettings).values({ id: 1, farmCode: data.farmCode }).run();
    if (data.productiveUnits.length > 0) tx.insert(productiveUnits).values(data.productiveUnits).run();
  },

  summary: (data) =>
    [
      data.farmCode ? `código ${data.farmCode}` : 'sin código de explotación',
      plural(data.productiveUnits.length, 'unidad productiva', 'unidades productivas'),
    ].join(', '),
});

/** Farm settings in backups. Goes before the modules, whose records may use them. */
export const farmBackupParticipant: BackupParticipant = {
  id: 'farm',
  title: 'Ajustes de la explotación',
  backup: farmBackup,
};
