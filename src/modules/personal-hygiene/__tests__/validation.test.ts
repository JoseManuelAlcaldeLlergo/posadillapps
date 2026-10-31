import { validateFields, validateRecordForm, validateTemplateForm, type FieldValues } from '../validation';

const fields: FieldValues = {
  productiveUnit: ' Ovino  y porcino ',
  action: 'Limpieza de manos, botas',
  place: 'Nave',
  result: 'Mensualmente año 2013',
  correctiveMeasures: '  ',
  dateText: '1 de cada mes 2013',
};

describe('validateFields', () => {
  it('normalizes texts and turns empty corrective measures into null', () => {
    expect(validateFields(fields)).toEqual({
      ok: true,
      value: {
        productiveUnit: 'Ovino y porcino',
        action: 'Limpieza de manos, botas',
        place: 'Nave',
        result: 'Mensualmente año 2013',
        correctiveMeasures: null,
        dateText: '1 de cada mes 2013',
      },
    });
  });

  it('requires every field except corrective measures', () => {
    const empty = { productiveUnit: '', action: '', place: '', result: '', correctiveMeasures: '', dateText: '' };
    const result = validateFields(empty);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(
        ['action', 'dateText', 'place', 'productiveUnit', 'result'].sort(),
      );
    }
  });
});

describe('validateRecordForm', () => {
  it('parses the year', () => {
    const result = validateRecordForm({ ...fields, year: ' 2013 ' });
    expect(result.ok && result.value.year).toBe(2013);
  });

  it('rejects a missing or invalid year', () => {
    expect(validateRecordForm({ ...fields, year: '' })).toEqual({
      ok: false,
      errors: { year: 'Indica el año' },
    });
    expect(validateRecordForm({ ...fields, year: '13' })).toEqual({
      ok: false,
      errors: { year: 'Año no válido (ejemplo: 2025)' },
    });
  });
});

describe('validateTemplateForm', () => {
  it('keeps the active flag and the year marker', () => {
    const result = validateTemplateForm({ ...fields, result: 'Mensualmente año {año}', active: false });
    expect(result).toMatchObject({ ok: true, value: { result: 'Mensualmente año {año}', active: false } });
  });
});
