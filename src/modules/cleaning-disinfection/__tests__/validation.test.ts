import {
  parseWaitingDays,
  validateApplicationForm,
  validateProductForm,
  validateRegularForm,
  type ApplicationFormValues,
} from '../validation';

const values = (overrides: Partial<ApplicationFormValues> = {}): ApplicationFormValues => ({
  date: '2025-03-31',
  productiveUnit: ' Ovino ',
  productName: 'Cal  en polvo',
  place: 'Naves, suelo y paredes',
  waitingDays: '0',
  reviewDate: null,
  ...overrides,
});

describe('parseWaitingDays', () => {
  it('accepts whole days, 0 included', () => {
    expect(parseWaitingDays('0')).toBe(0);
    expect(parseWaitingDays(' 15 ')).toBe(15);
    expect(parseWaitingDays('')).toBeNull();
    expect(parseWaitingDays('1,5')).toBeNull();
    expect(parseWaitingDays('-3')).toBeNull();
  });
});

describe('validateApplicationForm', () => {
  it('normalizes texts and keeps an empty review date as null', () => {
    expect(validateApplicationForm(values())).toEqual({
      ok: true,
      value: {
        date: '2025-03-31',
        productiveUnit: 'Ovino',
        productName: 'Cal en polvo',
        place: 'Naves, suelo y paredes',
        waitingDays: 0,
        reviewDate: null,
      },
    });
  });

  it('requires every field except the review date', () => {
    const result = validateApplicationForm(
      values({ date: '', productiveUnit: '', productName: ' ', place: '', waitingDays: '' }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(
        ['date', 'place', 'productName', 'productiveUnit', 'waitingDays'].sort(),
      );
    }
  });

  it('rejects invalid dates and waiting periods', () => {
    const result = validateApplicationForm(
      values({ date: '2025-02-30', reviewDate: '2025-13-01', waitingDays: '2.5' }),
    );
    expect(result).toEqual({
      ok: false,
      errors: {
        date: 'Fecha no válida',
        reviewDate: 'Fecha no válida',
        waitingDays: 'Escribe un número entero de días',
      },
    });
  });
});

describe('validateRegularForm', () => {
  it('requires a frequency and keeps the active flag', () => {
    const { date: _date, ...fields } = values();
    expect(validateRegularForm({ ...fields, frequency: '', active: true })).toMatchObject({
      ok: false,
      errors: { frequency: 'Indica la frecuencia' },
    });
    expect(validateRegularForm({ ...fields, frequency: ' A diario ', active: false })).toMatchObject({
      ok: true,
      value: { frequency: 'A diario', active: false },
    });
  });
});

describe('validateProductForm', () => {
  it('requires a name and a waiting period; the place is optional', () => {
    expect(validateProductForm({ name: ' Cipergen ', defaultWaitingDays: '15', defaultPlace: ' ' })).toEqual({
      ok: true,
      value: { name: 'Cipergen', defaultWaitingDays: 15, defaultPlace: null },
    });
    expect(validateProductForm({ name: '', defaultWaitingDays: '', defaultPlace: '' })).toMatchObject({
      ok: false,
      errors: { name: 'Escribe el nombre del producto' },
    });
  });
});
