import { findByName, nameKey, normalizeName } from '../names';
import { validateEntryForm, type EntryFormValues } from '../validation';

const valid: EntryFormValues = {
  date: '2025-03-31',
  quantity: '9.340',
  unit: 'kg',
  supplierName: '  Mezclas  del Valle ',
  feedName: 'Cerdos crecimiento',
  invoice: ' F2000 525 ',
};

describe('validateEntryForm', () => {
  it('returns clean values', () => {
    expect(validateEntryForm(valid)).toEqual({
      ok: true,
      value: {
        date: '2025-03-31',
        quantity: 9340,
        unit: 'kg',
        supplierName: 'Mezclas del Valle',
        feedName: 'Cerdos crecimiento',
        invoice: 'F2000 525',
      },
    });
  });

  it('accepts decimals with comma and an empty invoice', () => {
    const result = validateEntryForm({ ...valid, quantity: '1.234,5', invoice: '  ' });
    expect(result).toMatchObject({ ok: true, value: { quantity: 1234.5, invoice: null } });
  });

  it('reports every missing required field', () => {
    const result = validateEntryForm({
      ...valid,
      date: '',
      quantity: '',
      supplierName: ' ',
      feedName: '',
    });
    expect(result).toEqual({
      ok: false,
      errors: {
        date: 'Indica la fecha',
        quantity: 'Indica la cantidad',
        supplierName: 'Indica el proveedor',
        feedName: 'Indica la denominación comercial del pienso',
      },
    });
  });

  it('rejects invalid and non-positive quantities and invalid dates', () => {
    expect(validateEntryForm({ ...valid, quantity: 'mucho' })).toMatchObject({
      ok: false,
      errors: { quantity: 'Cantidad no válida (ejemplo: 9.340 o 1.234,5)' },
    });
    expect(validateEntryForm({ ...valid, quantity: '0' })).toMatchObject({
      ok: false,
      errors: { quantity: 'La cantidad debe ser mayor que 0' },
    });
    expect(validateEntryForm({ ...valid, date: '2025-02-30' })).toMatchObject({
      ok: false,
      errors: { date: 'Fecha no válida' },
    });
  });
});

describe('names', () => {
  it('normalizes spaces', () => {
    expect(normalizeName('  Mezclas   del\tValle ')).toBe('Mezclas del Valle');
  });

  it('builds a key ignoring case, accents and spaces', () => {
    expect(nameKey(' Denominación  Comercial ')).toBe('denominacion comercial');
    expect(nameKey('Sierra de los Santos SCA')).toBe(nameKey('sierra de los santos sca'));
  });

  it('finds items by name', () => {
    const list = [
      { id: 1, name: 'Mezclas del Valle' },
      { id: 2, name: 'Sierra de los Santos SCA' },
    ];
    expect(findByName(list, 'mezclas del valle')?.id).toBe(1);
    expect(findByName(list, 'Otro')).toBeUndefined();
    expect(findByName(list, '  ')).toBeUndefined();
  });
});
