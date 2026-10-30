import { validateRegularForm, validateVisitForm, type VisitFormValues } from '../validation';

const visit: VisitFormValues = {
  plate: ' 6105  hhr ',
  date: '2025-03-31',
  reason: ' Veterinario ',
  vehicleType: 'private_car',
};

describe('validateVisitForm', () => {
  it('normalizes plate and reason', () => {
    expect(validateVisitForm(visit)).toEqual({
      ok: true,
      value: { plate: '6105 HHR', date: '2025-03-31', reason: 'Veterinario', vehicleType: 'private_car' },
    });
  });

  it('requires every field', () => {
    expect(validateVisitForm({ plate: ' ', date: '', reason: '', vehicleType: null })).toEqual({
      ok: false,
      errors: {
        plate: 'Indica la matrícula',
        date: 'Indica la fecha',
        reason: 'Indica el motivo de la visita',
        vehicleType: 'Elige el tipo de vehículo',
      },
    });
  });

  it('rejects invalid dates', () => {
    expect(validateVisitForm({ ...visit, date: '2025-02-30' })).toMatchObject({
      ok: false,
      errors: { date: 'Fecha no válida' },
    });
  });
});

describe('validateRegularForm', () => {
  it('normalizes and keeps the active flag', () => {
    expect(
      validateRegularForm({
        plate: 'co-46336-ve',
        frequency: ' A  diario',
        reason: 'Control y cuidado de animales',
        vehicleType: 'private_car',
        active: false,
      }),
    ).toEqual({
      ok: true,
      value: {
        plate: 'CO-46336-VE',
        frequency: 'A diario',
        reason: 'Control y cuidado de animales',
        vehicleType: 'private_car',
        active: false,
      },
    });
  });

  it('requires frequency and type', () => {
    expect(
      validateRegularForm({ plate: 'X', frequency: '', reason: 'Y', vehicleType: null, active: true }),
    ).toEqual({
      ok: false,
      errors: { frequency: 'Indica la frecuencia', vehicleType: 'Elige el tipo de vehículo' },
    });
  });
});
