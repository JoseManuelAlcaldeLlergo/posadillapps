import { parseYear } from '@/core/dates';
import { parseIsoDate } from '@/core/export/format';
import { normalizeName } from '@/core/text';

import { normalizePlate } from '../vehicle-entries';
import type { CleaningFields, OneOffInput, PeriodicFields, PeriodicInput, VehicleInput } from './repository';

/** Plate or chassis number (VIN), whose format is not validated. */
export const MAX_PLATE_LENGTH = 17;

/** Raw form state of the shared fields, as typed by the user. */
export type FieldValues = {
  plate: string;
  productName: string;
  vehicleType: string;
  reviewText: string;
};

export type OneOffFormValues = FieldValues & { date: string };
export type PeriodicFormValues = FieldValues & { frequency: string };
export type PeriodicRecordFormValues = PeriodicFormValues & { year: string };

export type VehicleFormValues = {
  plate: string;
  frequency: string;
  productName: string;
  vehicleType: string;
  active: boolean;
};

export type FormErrors<Values> = Partial<Record<keyof Values, string>>;

export type Validation<Values, Input> =
  | { ok: true; value: Input }
  | { ok: false; errors: FormErrors<Values> };

function plateError(plate: string): string | undefined {
  if (!plate) return 'Indica la matrícula o el número de bastidor';
  return plate.length > MAX_PLATE_LENGTH ? `Máximo ${MAX_PLATE_LENGTH} caracteres` : undefined;
}

/** Plate, product and type: the fields every record and vehicle has. */
function validateCommon(values: Pick<FieldValues, 'plate' | 'productName' | 'vehicleType'>) {
  const errors: FormErrors<FieldValues> = {};
  const plate = normalizePlate(values.plate);
  const productName = normalizeName(values.productName);
  const vehicleType = normalizeName(values.vehicleType);
  const plateMessage = plateError(plate);
  if (plateMessage) errors.plate = plateMessage;
  if (!productName) errors.productName = 'Indica el producto empleado';
  if (!vehicleType) errors.vehicleType = 'Indica el tipo de vehículo';
  return { errors, plate, productName, vehicleType };
}

function validateFields(values: FieldValues): Validation<FieldValues, CleaningFields> {
  const { errors, plate, productName, vehicleType } = validateCommon(values);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { plate, productName, vehicleType, reviewText: normalizeName(values.reviewText) || null },
  };
}

export function validateOneOffForm(values: OneOffFormValues): Validation<OneOffFormValues, OneOffInput> {
  const fields = validateFields(values);
  const errors: FormErrors<OneOffFormValues> = fields.ok ? {} : { ...fields.errors };
  let dateError: string | undefined;
  if (!values.date) dateError = 'Indica la fecha';
  else {
    try {
      parseIsoDate(values.date);
    } catch {
      dateError = 'Fecha no válida';
    }
  }
  if (dateError) errors.date = dateError;
  if (!fields.ok || dateError) return { ok: false, errors };
  return { ok: true, value: { ...fields.value, date: values.date } };
}

/** Fields of a periodic cleaning, as reviewed when generating a year. */
export function validatePeriodicFields(
  values: PeriodicFormValues,
): Validation<PeriodicFormValues, PeriodicFields> {
  const fields = validateFields(values);
  const errors: FormErrors<PeriodicFormValues> = fields.ok ? {} : { ...fields.errors };
  const frequency = normalizeName(values.frequency);
  if (!frequency) errors.frequency = 'Indica la frecuencia';
  if (!fields.ok || !frequency) return { ok: false, errors };
  return { ok: true, value: { ...fields.value, frequency } };
}

export function validatePeriodicForm(
  values: PeriodicRecordFormValues,
): Validation<PeriodicRecordFormValues, PeriodicInput> {
  const fields = validatePeriodicFields(values);
  const errors: FormErrors<PeriodicRecordFormValues> = fields.ok ? {} : { ...fields.errors };
  const year = parseYear(values.year);
  if (year === null) errors.year = values.year.trim() ? 'Año no válido (ejemplo: 2025)' : 'Indica el año';
  if (!fields.ok || year === null) return { ok: false, errors };
  return { ok: true, value: { ...fields.value, year } };
}

export function validateVehicleForm(values: VehicleFormValues): Validation<VehicleFormValues, VehicleInput> {
  const { errors: common, plate, productName, vehicleType } = validateCommon(values);
  const errors: FormErrors<VehicleFormValues> = { ...common };
  const frequency = normalizeName(values.frequency);
  if (!frequency) errors.frequency = 'Indica la frecuencia';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { plate, frequency, productName, vehicleType, active: values.active } };
}

/** Form texts of a saved cleaning. */
export function toFieldValues(fields: CleaningFields): FieldValues {
  return {
    plate: fields.plate,
    productName: fields.productName,
    vehicleType: fields.vehicleType,
    reviewText: fields.reviewText ?? '',
  };
}
