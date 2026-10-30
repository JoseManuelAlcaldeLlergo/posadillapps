import { asc } from 'drizzle-orm';

import { BackupFormatError, defineModuleBackup } from '@/core/backup/types';
import {
  optionalString,
  requireArray,
  requireBoolean,
  requireInteger,
  requireIsoDate,
  requireRecord,
  requireString,
  requireUniqueIds,
} from '@/core/backup/validate';
import type { SyncDatabase } from '@/core/db/types';

import { vehicleRegulars, vehicleVisits, type VehicleRegular, type VehicleVisit } from './schema';
import { isVehicleType, type VehicleType } from './vehicleTypes';

export type VehicleEntriesBackupData = {
  regulars: VehicleRegular[];
  visits: VehicleVisit[];
};

const BATCH_SIZE = 500;

function parseVehicleType(value: unknown, path: string): VehicleType {
  const type = requireString(value, path);
  if (!isVehicleType(type)) {
    throw new BackupFormatError(`Dato no válido en ${path}: tipo de vehículo desconocido «${type}»`);
  }
  return type;
}

function parseRegular(value: unknown, path: string): VehicleRegular {
  const row = requireRecord(value, path);
  return {
    id: requireInteger(row.id, `${path}.id`),
    plate: requireString(row.plate, `${path}.plate`),
    plateKey: requireString(row.plateKey, `${path}.plateKey`),
    frequency: requireString(row.frequency, `${path}.frequency`),
    reason: requireString(row.reason, `${path}.reason`),
    vehicleType: parseVehicleType(row.vehicleType, `${path}.vehicleType`),
    active: requireBoolean(row.active, `${path}.active`),
    createdAt: requireString(row.createdAt, `${path}.createdAt`),
    updatedAt: requireString(row.updatedAt, `${path}.updatedAt`),
  };
}

function parseVisit(value: unknown, path: string): VehicleVisit {
  const row = requireRecord(value, path);
  return {
    id: requireInteger(row.id, `${path}.id`),
    date: requireIsoDate(row.date, `${path}.date`),
    plate: requireString(row.plate, `${path}.plate`),
    plateKey: requireString(row.plateKey, `${path}.plateKey`),
    reason: requireString(row.reason, `${path}.reason`),
    vehicleType: parseVehicleType(row.vehicleType, `${path}.vehicleType`),
    source: optionalString(row.source, `${path}.source`),
    createdAt: requireString(row.createdAt, `${path}.createdAt`),
    updatedAt: requireString(row.updatedAt, `${path}.updatedAt`),
  };
}

function insertInBatches<T>(rows: T[], insert: (batch: T[]) => void): void {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) insert(rows.slice(i, i + BATCH_SIZE));
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export const vehicleEntriesBackup = defineModuleBackup<VehicleEntriesBackupData>({
  version: 1,

  export: (db: SyncDatabase) => ({
    regulars: db.select().from(vehicleRegulars).orderBy(asc(vehicleRegulars.id)).all(),
    visits: db.select().from(vehicleVisits).orderBy(asc(vehicleVisits.id)).all(),
  }),

  parse: (data) => {
    if (data === undefined) return { regulars: [], visits: [] };
    const root = requireRecord(data, 'vehicle-entries');
    const parsed: VehicleEntriesBackupData = {
      regulars: requireArray(root.regulars, 'regulars').map((row, i) =>
        parseRegular(row, `regulars[${i}]`),
      ),
      visits: requireArray(root.visits, 'visits').map((row, i) => parseVisit(row, `visits[${i}]`)),
    };
    requireUniqueIds(parsed.regulars, 'regulars');
    requireUniqueIds(parsed.visits, 'visits');
    return parsed;
  },

  clear: (tx) => {
    tx.delete(vehicleVisits).run();
    tx.delete(vehicleRegulars).run();
  },

  restore: (tx, data) => {
    insertInBatches(data.regulars, (batch) => tx.insert(vehicleRegulars).values(batch).run());
    insertInBatches(data.visits, (batch) => tx.insert(vehicleVisits).values(batch).run());
  },

  summary: (data) =>
    [
      plural(data.regulars.length, 'vehículo habitual', 'vehículos habituales'),
      plural(data.visits.length, 'visita', 'visitas'),
    ].join(', '),
});
