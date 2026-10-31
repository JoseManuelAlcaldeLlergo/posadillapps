import { asc } from 'drizzle-orm';

import { BackupFormatError, defineModuleBackup } from '@/core/backup/types';
import {
  optionalInteger,
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

import {
  cleaningVehicles,
  oneOffCleanings,
  periodicCleanings,
  type CleaningVehicle,
  type OneOffCleaning,
  type PeriodicCleaning,
} from './schema';

export type VehicleCleaningBackupData = {
  vehicles: CleaningVehicle[];
  periodic: PeriodicCleaning[];
  oneOffs: OneOffCleaning[];
};

const BATCH_SIZE = 500;

/** Fields shared by vehicles and cleanings. */
function parseCommon(row: Record<string, unknown>, path: string) {
  return {
    id: requireInteger(row.id, `${path}.id`),
    plate: requireString(row.plate, `${path}.plate`),
    plateKey: requireString(row.plateKey, `${path}.plateKey`),
    productName: requireString(row.productName, `${path}.productName`),
    vehicleType: requireString(row.vehicleType, `${path}.vehicleType`),
    createdAt: requireString(row.createdAt, `${path}.createdAt`),
    updatedAt: requireString(row.updatedAt, `${path}.updatedAt`),
  };
}

function parseVehicle(value: unknown, path: string): CleaningVehicle {
  const row = requireRecord(value, path);
  return {
    ...parseCommon(row, path),
    frequency: requireString(row.frequency, `${path}.frequency`),
    active: requireBoolean(row.active, `${path}.active`),
  };
}

function parsePeriodic(value: unknown, path: string): PeriodicCleaning {
  const row = requireRecord(value, path);
  return {
    ...parseCommon(row, path),
    year: requireInteger(row.year, `${path}.year`),
    vehicleId: optionalInteger(row.vehicleId, `${path}.vehicleId`),
    frequency: requireString(row.frequency, `${path}.frequency`),
    reviewText: optionalString(row.reviewText, `${path}.reviewText`),
  };
}

function parseOneOff(value: unknown, path: string): OneOffCleaning {
  const row = requireRecord(value, path);
  return {
    ...parseCommon(row, path),
    date: requireIsoDate(row.date, `${path}.date`),
    reviewText: optionalString(row.reviewText, `${path}.reviewText`),
  };
}

function insertInBatches<T>(rows: T[], insert: (batch: T[]) => void): void {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) insert(rows.slice(i, i + BATCH_SIZE));
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export const vehicleCleaningBackup = defineModuleBackup<VehicleCleaningBackupData>({
  version: 1,

  export: (db: SyncDatabase) => ({
    vehicles: db.select().from(cleaningVehicles).orderBy(asc(cleaningVehicles.id)).all(),
    periodic: db.select().from(periodicCleanings).orderBy(asc(periodicCleanings.id)).all(),
    oneOffs: db.select().from(oneOffCleanings).orderBy(asc(oneOffCleanings.id)).all(),
  }),

  parse: (data) => {
    if (data === undefined) return { vehicles: [], periodic: [], oneOffs: [] };
    const root = requireRecord(data, 'vehicle-cleaning');
    const parsed: VehicleCleaningBackupData = {
      vehicles: requireArray(root.vehicles, 'vehicles').map((row, i) => parseVehicle(row, `vehicles[${i}]`)),
      periodic: requireArray(root.periodic, 'periodic').map((row, i) => parsePeriodic(row, `periodic[${i}]`)),
      oneOffs: requireArray(root.oneOffs, 'oneOffs').map((row, i) => parseOneOff(row, `oneOffs[${i}]`)),
    };
    requireUniqueIds(parsed.vehicles, 'vehicles');
    requireUniqueIds(parsed.periodic, 'periodic');
    requireUniqueIds(parsed.oneOffs, 'oneOffs');

    const plateKeys = new Set<string>();
    parsed.vehicles.forEach((vehicle, i) => {
      if (plateKeys.has(vehicle.plateKey)) {
        throw new BackupFormatError(`Dato no válido en vehicles[${i}].plate: matrícula repetida`);
      }
      plateKeys.add(vehicle.plateKey);
    });
    const vehicleIds = new Set(parsed.vehicles.map((vehicle) => vehicle.id));
    parsed.periodic.forEach((row, i) => {
      if (row.vehicleId !== null && !vehicleIds.has(row.vehicleId)) {
        throw new BackupFormatError(
          `Dato no válido en periodic[${i}].vehicleId: no existe el vehículo con id ${row.vehicleId}`,
        );
      }
    });
    return parsed;
  },

  clear: (tx) => {
    tx.delete(periodicCleanings).run();
    tx.delete(oneOffCleanings).run();
    tx.delete(cleaningVehicles).run();
  },

  restore: (tx, data) => {
    insertInBatches(data.vehicles, (batch) => tx.insert(cleaningVehicles).values(batch).run());
    insertInBatches(data.periodic, (batch) => tx.insert(periodicCleanings).values(batch).run());
    insertInBatches(data.oneOffs, (batch) => tx.insert(oneOffCleanings).values(batch).run());
  },

  summary: (data) =>
    [
      plural(data.periodic.length, 'limpieza periódica', 'limpiezas periódicas'),
      plural(data.oneOffs.length, 'limpieza puntual', 'limpiezas puntuales'),
      plural(data.vehicles.length, 'vehículo', 'vehículos'),
    ].join(', '),
});
