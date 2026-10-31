/**
 * @jest-environment node
 */
import { createTestDb } from '@/core/db/testing/createTestDb';
import type { SyncDatabase } from '@/core/db/types';

import {
  countRecordsInYearRange,
  createRecord,
  deleteRecord,
  fieldSuggestions,
  getRecord,
  listRecordActions,
  listRecords,
  listRecordsInYearRange,
  listRecordYears,
  previewYear,
  saveGeneratedYear,
  updateRecord,
  type RecordFields,
} from '../repository';
import {
  deleteTemplate,
  getTemplate,
  listActiveTemplates,
  listTemplates,
  moveTemplate,
  saveTemplate,
  type TemplateInput,
} from '../templatesRepository';

let db: SyncDatabase;
let close: () => void;

beforeEach(() => {
  ({ db, close } = createTestDb());
});

afterEach(() => close());

const FARM = 'ES140000000000';

function template(overrides: Partial<TemplateInput> = {}): TemplateInput {
  return {
    action: 'Limpieza de manos, botas',
    productiveUnit: 'Ovino y porcino',
    place: 'Nave',
    result: 'Mensualmente año {año}',
    correctiveMeasures: null,
    dateText: '1 de cada mes {año}',
    active: true,
    ...overrides,
  };
}

function fields(overrides: Partial<RecordFields> = {}): RecordFields {
  return {
    productiveUnit: 'Ovino',
    action: 'Desinfección de manos',
    place: 'Naves',
    result: 'Semanalmente año 2013',
    correctiveMeasures: null,
    dateText: 'Cada lunes 2013',
    ...overrides,
  };
}

function generate(year: number) {
  return saveGeneratedYear(db, year, FARM, previewYear(db, year).rows);
}

describe('templates', () => {
  it('adds templates at the end and lists active ones', () => {
    saveTemplate(db, template({ action: 'A' }));
    saveTemplate(db, template({ action: 'B', active: false }));
    saveTemplate(db, template({ action: 'C' }));
    expect(listTemplates(db).map((t) => t.action)).toEqual(['A', 'B', 'C']);
    expect(listActiveTemplates(db).map((t) => t.action)).toEqual(['A', 'C']);
  });

  it('moves templates, ignoring moves past the ends', () => {
    const a = saveTemplate(db, template({ action: 'A' }));
    saveTemplate(db, template({ action: 'B' }));
    const c = saveTemplate(db, template({ action: 'C' }));
    moveTemplate(db, c.id, -1);
    moveTemplate(db, a.id, -1);
    expect(listTemplates(db).map((t) => t.action)).toEqual(['A', 'C', 'B']);
  });

  it('updates a template', () => {
    const a = saveTemplate(db, template());
    saveTemplate(db, template({ place: 'Naves', active: false }), a.id);
    expect(getTemplate(db, a.id)).toMatchObject({ place: 'Naves', active: false });
  });
});

describe('generating a year', () => {
  it('proposes one row per active template, in order, with the year filled in', () => {
    saveTemplate(db, template());
    saveTemplate(db, template({ action: 'Inactiva', active: false }));
    saveTemplate(db, template({ action: 'Ropa de trabajo', result: 'Revisado', dateText: 'Diario {año}' }));

    const { rows, skipped } = previewYear(db, 2013);
    expect(skipped).toEqual([]);
    expect(rows.map((r) => [r.action, r.result, r.dateText])).toEqual([
      ['Limpieza de manos, botas', 'Mensualmente año 2013', '1 de cada mes 2013'],
      ['Ropa de trabajo', 'Revisado', 'Diario 2013'],
    ]);
  });

  it('saves the reviewed rows with the farm code snapshot', () => {
    saveTemplate(db, template());
    const [row] = previewYear(db, 2013).rows;
    expect(saveGeneratedYear(db, 2013, FARM, [{ ...row, place: 'Naves' }])).toEqual({
      inserted: 1,
      skipped: 0,
    });
    expect(listRecords(db)).toMatchObject([{ year: 2013, farmCode: FARM, place: 'Naves' }]);
  });

  it('does not duplicate rows when the same year is generated again', () => {
    const a = saveTemplate(db, template({ action: 'A' }));
    generate(2013);
    saveTemplate(db, template({ action: 'B' }));

    const preview = previewYear(db, 2013);
    expect(preview.skipped.map((t) => t.id)).toEqual([a.id]);
    expect(preview.rows.map((r) => r.action)).toEqual(['B']);
    expect(generate(2013)).toEqual({ inserted: 1, skipped: 0 });
    expect(generate(2013)).toEqual({ inserted: 0, skipped: 0 });
    expect(listRecords(db, { year: 2013 }).map((r) => r.action)).toEqual(['A', 'B']);
  });

  it('skips stale proposals when the year was saved meanwhile', () => {
    saveTemplate(db, template());
    const stale = previewYear(db, 2013).rows;
    generate(2013);
    expect(saveGeneratedYear(db, 2013, FARM, [...stale, ...stale])).toEqual({ inserted: 0, skipped: 2 });
    expect(countRecordsInYearRange(db, { fromYear: 2013, toYear: 2013 })).toBe(1);
  });

  it('keeps saved rows when the template changes or is deleted', () => {
    const a = saveTemplate(db, template());
    generate(2013);
    saveTemplate(db, template({ result: 'Otro {año}' }), a.id);
    expect(listRecords(db)[0].result).toBe('Mensualmente año 2013');
    deleteTemplate(db, a.id);
    expect(listRecords(db)[0]).toMatchObject({ result: 'Mensualmente año 2013', templateId: null });
  });
});

describe('single rows', () => {
  it('creates a row from a template in the template position', () => {
    saveTemplate(db, template({ action: 'A' }));
    const b = saveTemplate(db, template({ action: 'B' }));
    const row = createRecord(db, { ...fields(), year: 2013, templateId: b.id }, FARM);
    expect(row).toMatchObject({ templateId: b.id, position: b.sortOrder, farmCode: FARM });
  });

  it('puts rows from scratch after the templates of the year', () => {
    saveTemplate(db, template({ action: 'A' }));
    generate(2013);
    createRecord(db, { ...fields({ action: 'Suelta' }), year: 2013, templateId: null }, FARM);
    expect(listRecords(db, { year: 2013 }).map((r) => r.action)).toEqual(['A', 'Suelta']);
  });

  it('saves a row from scratch as a template with the year marker', () => {
    const row = createRecord(db, { ...fields(), year: 2013, templateId: null }, FARM, {
      saveAsTemplate: true,
    });
    const saved = row.templateId === null ? undefined : getTemplate(db, row.templateId);
    expect(saved).toMatchObject({
      action: 'Desinfección de manos',
      result: 'Semanalmente año {año}',
      dateText: 'Cada lunes {año}',
      active: true,
    });
    // The new template already has its row in 2013.
    expect(previewYear(db, 2013).rows).toEqual([]);
    expect(previewYear(db, 2014).rows[0].result).toBe('Semanalmente año 2014');
  });

  it('updates texts and year, keeping the farm code and position', () => {
    const row = createRecord(db, { ...fields(), year: 2013, templateId: null }, FARM);
    const updated = updateRecord(db, row.id, { ...fields({ place: 'Nave' }), year: 2014 });
    expect(updated).toMatchObject({ year: 2014, place: 'Nave', farmCode: FARM, position: row.position });
  });

  it('deletes a row', () => {
    const row = createRecord(db, { ...fields(), year: 2013, templateId: null }, FARM);
    deleteRecord(db, row.id);
    expect(getRecord(db, row.id)).toBeUndefined();
  });
});

describe('lists and export', () => {
  beforeEach(() => {
    saveTemplate(db, template({ action: 'A' }));
    saveTemplate(db, template({ action: 'B', place: 'Naves' }));
    generate(2012);
    generate(2013);
    generate(2014);
  });

  it('lists the newest year first, in template order, with filters', () => {
    expect(listRecords(db).map((r) => `${r.year} ${r.action}`)).toEqual([
      '2014 A',
      '2014 B',
      '2013 A',
      '2013 B',
      '2012 A',
      '2012 B',
    ]);
    expect(listRecords(db, { year: 2013, action: 'B' })).toHaveLength(1);
    expect(listRecordYears(db)).toEqual([2014, 2013, 2012]);
    expect(listRecordActions(db)).toEqual(['A', 'B']);
  });

  it('exports a year range, both ends inclusive, oldest first', () => {
    const range = { fromYear: 2012, toYear: 2013 };
    expect(listRecordsInYearRange(db, range).map((r) => `${r.year} ${r.action}`)).toEqual([
      '2012 A',
      '2012 B',
      '2013 A',
      '2013 B',
    ]);
    expect(countRecordsInYearRange(db, range)).toBe(4);
    expect(countRecordsInYearRange(db, { fromYear: 2014, toYear: 2014 })).toBe(2);
    expect(countRecordsInYearRange(db, { fromYear: 2015, toYear: 2020 })).toBe(0);
  });

  it('suggests distinct actions and places', () => {
    expect(fieldSuggestions(db)).toEqual({ actions: ['A', 'B'], places: ['Nave', 'Naves'] });
  });
});
