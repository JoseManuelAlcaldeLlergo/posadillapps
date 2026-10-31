import { defaultReviewText } from '../suggestions';
import {
  validateOneOffForm,
  validatePeriodicForm,
  validateVehicleForm,
  type OneOffFormValues,
} from '../validation';

const oneOff = (overrides: Partial<OneOffFormValues> = {}): OneOffFormValues => ({
  date: '2023-05-10',
  plate: ' co-46336  ve ',
  productName: '  Cipergen ',
  vehicleType: 'Camión',
  reviewText: '',
  ...overrides,
});

describe('validateOneOffForm', () => {
  it('normalizes plate and texts, and stores an empty review as null', () => {
    expect(validateOneOffForm(oneOff())).toEqual({
      ok: true,
      value: {
        date: '2023-05-10',
        plate: 'CO-46336 VE',
        productName: 'Cipergen',
        vehicleType: 'Camión',
        reviewText: null,
      },
    });
  });

  it('accepts a 17-character chassis number and rejects longer ones', () => {
    expect(validateOneOffForm(oneOff({ plate: 'vf1rfb00x56789012' }))).toMatchObject({
      ok: true,
      value: { plate: 'VF1RFB00X56789012' },
    });
    expect(validateOneOffForm(oneOff({ plate: 'VF1RFB00X567890123' }))).toEqual({
      ok: false,
      errors: { plate: 'Máximo 17 caracteres' },
    });
  });

  it('requires date, plate, product and type', () => {
    expect(validateOneOffForm(oneOff({ date: '', plate: ' ', productName: '', vehicleType: '' }))).toEqual({
      ok: false,
      errors: {
        date: 'Indica la fecha',
        plate: 'Indica la matrícula o el número de bastidor',
        productName: 'Indica el producto empleado',
        vehicleType: 'Indica el tipo de vehículo',
      },
    });
    expect(validateOneOffForm(oneOff({ date: '2023-02-30' }))).toEqual({
      ok: false,
      errors: { date: 'Fecha no válida' },
    });
  });
});

describe('validatePeriodicForm', () => {
  it('requires frequency and a valid year', () => {
    const values = { ...oneOff(), frequency: ' Semanalmente ', year: '2023', reviewText: 'Semanalmente 2023' };
    expect(validatePeriodicForm(values)).toMatchObject({
      ok: true,
      value: { year: 2023, frequency: 'Semanalmente', reviewText: 'Semanalmente 2023' },
    });
    expect(validatePeriodicForm({ ...values, frequency: '', year: '23' })).toEqual({
      ok: false,
      errors: { frequency: 'Indica la frecuencia', year: 'Año no válido (ejemplo: 2025)' },
    });
  });
});

describe('validateVehicleForm', () => {
  it('requires plate, frequency, product and type', () => {
    expect(
      validateVehicleForm({ plate: '', frequency: '', productName: '', vehicleType: '', active: true }),
    ).toEqual({
      ok: false,
      errors: {
        plate: 'Indica la matrícula o el número de bastidor',
        frequency: 'Indica la frecuencia',
        productName: 'Indica el producto empleado',
        vehicleType: 'Indica el tipo de vehículo',
      },
    });
    expect(
      validateVehicleForm({
        plate: '6105 hhr',
        frequency: 'Semanalmente',
        productName: 'Cipergen',
        vehicleType: 'Turismo',
        active: false,
      }),
    ).toEqual({
      ok: true,
      value: { plate: '6105 HHR', frequency: 'Semanalmente', productName: 'Cipergen', vehicleType: 'Turismo', active: false },
    });
  });
});

describe('defaultReviewText', () => {
  it('joins frequency and year', () => {
    expect(defaultReviewText('Semanalmente', 2023)).toBe('Semanalmente 2023');
  });
});
