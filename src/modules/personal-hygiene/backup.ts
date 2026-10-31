import { asc } from 'drizzle-orm';

import { BackupFormatError, defineModuleBackup } from '@/core/backup/types';
import {
  optionalInteger,
  optionalString,
  requireArray,
  requireBoolean,
  requireInteger,
  requireRecord,
  requireString,
  requireUniqueIds,
} from '@/core/backup/validate';
import type { SyncDatabase } from '@/core/db/types';

import { hygieneRecords, hygieneTemplates, type HygieneRecord, type HygieneTemplate } from './schema';

export type PersonalHygieneBackupData = {
  templates: HygieneTemplate[];
  records: HygieneRecord[];
};

const BATCH_SIZE = 500;

function parseTemplate(value: unknown, path: string): HygieneTemplate {
  const row = requireRecord(value, path);
  return {
    id: requireInteger(row.id, `${path}.id`),
    action: requireString(row.action, `${path}.action`),
    productiveUnit: requireString(row.productiveUnit, `${path}.productiveUnit`),
    place: requireString(row.place, `${path}.place`),
    result: requireString(row.result, `${path}.result`),
    correctiveMeasures: optionalString(row.correctiveMeasures, `${path}.correctiveMeasures`),
    dateText: requireString(row.dateText, `${path}.dateText`),
    active: requireBoolean(row.active, `${path}.active`),
    sortOrder: requireInteger(row.sortOrder, `${path}.sortOrder`),
    createdAt: requireString(row.createdAt, `${path}.createdAt`),
    updatedAt: requireString(row.updatedAt, `${path}.updatedAt`),
  };
}

function parseRecord(value: unknown, path: string): HygieneRecord {
  const row = requireRecord(value, path);
  return {
    id: requireInteger(row.id, `${path}.id`),
    year: requireInteger(row.year, `${path}.year`),
    farmCode: requireString(row.farmCode, `${path}.farmCode`),
    productiveUnit: requireString(row.productiveUnit, `${path}.productiveUnit`),
    action: requireString(row.action, `${path}.action`),
    place: requireString(row.place, `${path}.place`),
    result: requireString(row.result, `${path}.result`),
    correctiveMeasures: optionalString(row.correctiveMeasures, `${path}.correctiveMeasures`),
    dateText: requireString(row.dateText, `${path}.dateText`),
    templateId: optionalInteger(row.templateId, `${path}.templateId`),
    position: requireInteger(row.position, `${path}.position`),
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

export const personalHygieneBackup = defineModuleBackup<PersonalHygieneBackupData>({
  version: 1,

  export: (db: SyncDatabase) => ({
    templates: db.select().from(hygieneTemplates).orderBy(asc(hygieneTemplates.id)).all(),
    records: db.select().from(hygieneRecords).orderBy(asc(hygieneRecords.id)).all(),
  }),

  parse: (data) => {
    if (data === undefined) return { templates: [], records: [] };
    const root = requireRecord(data, 'personal-hygiene');
    const parsed: PersonalHygieneBackupData = {
      templates: requireArray(root.templates, 'templates').map((row, i) =>
        parseTemplate(row, `templates[${i}]`),
      ),
      records: requireArray(root.records, 'records').map((row, i) => parseRecord(row, `records[${i}]`)),
    };
    requireUniqueIds(parsed.templates, 'templates');
    requireUniqueIds(parsed.records, 'records');
    const templateIds = new Set(parsed.templates.map((t) => t.id));
    parsed.records.forEach((record, i) => {
      if (record.templateId !== null && !templateIds.has(record.templateId)) {
        throw new BackupFormatError(
          `Dato no válido en records[${i}].templateId: no existe la plantilla con id ${record.templateId}`,
        );
      }
    });
    return parsed;
  },

  clear: (tx) => {
    tx.delete(hygieneRecords).run();
    tx.delete(hygieneTemplates).run();
  },

  restore: (tx, data) => {
    insertInBatches(data.templates, (batch) => tx.insert(hygieneTemplates).values(batch).run());
    insertInBatches(data.records, (batch) => tx.insert(hygieneRecords).values(batch).run());
  },

  summary: (data) =>
    [
      plural(data.records.length, 'fila', 'filas'),
      plural(data.templates.length, 'plantilla', 'plantillas'),
    ].join(', '),
});
