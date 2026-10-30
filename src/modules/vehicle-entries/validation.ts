import { parseIsoDate } from '@/core/export/format';
import { normalizeName } from '@/core/text';

import { normalizePlate } from './plates';
import type { RegularInput, VisitInput } from './repository';
import type { VehicleType } from './vehicleTypes';

/** Raw form state of a regular vehicle, as typed by the user. */
export type RegularFormValues = {
  plate: string;
  frequency: string;
  reason: string;
  vehicleType: VehicleType | null;
  active: boolean;
};

/** Raw form state of a visit, as typed by the user. */
export type VisitFormValues = {
  plate: string;
  date: string;
  reason: string;
  vehicleType: VehicleType | null;
};

export type FormErrors<Values> = Partial<Record<keyof Values, string>>;

export type Validation<Values, Input> =
  | { ok: true; value: Input }
  | { ok: false; errors: FormErrors<Values> };

const PLATE_REQUIRED = 'Indica la matrícula';
const REASON_REQUIRED = 'Indica el motivo de la visita';
const TYPE_REQUIRED = 'Elige el tipo de vehículo';

export function validateRegularForm(
  values: RegularFormValues,
): Validation<RegularFormValues, RegularInput> {
  const errors: FormErrors<RegularFormValues> = {};
  const plate = normalizePlate(values.plate);
  const frequency = normalizeName(values.frequency);
  const reason = normalizeName(values.reason);

  if (!plate) errors.plate = PLATE_REQUIRED;
  if (!frequency) errors.frequency = 'Indica la frecuencia';
  if (!reason) errors.reason = REASON_REQUIRED;
  if (!values.vehicleType) errors.vehicleType = TYPE_REQUIRED;

  if (Object.keys(errors).length > 0 || !values.vehicleType) return { ok: false, errors };
  return {
    ok: true,
    value: { plate, frequency, reason, vehicleType: values.vehicleType, active: values.active },
  };
}

export function validateVisitForm(values: VisitFormValues): Validation<VisitFormValues, VisitInput> {
  const errors: FormErrors<VisitFormValues> = {};
  const plate = normalizePlate(values.plate);
  const reason = normalizeName(values.reason);

  if (!plate) errors.plate = PLATE_REQUIRED;
  if (!values.date) {
    errors.date = 'Indica la fecha';
  } else {
    try {
      parseIsoDate(values.date);
    } catch {
      errors.date = 'Fecha no válida';
    }
  }
  if (!reason) errors.reason = REASON_REQUIRED;
  if (!values.vehicleType) errors.vehicleType = TYPE_REQUIRED;

  if (Object.keys(errors).length > 0 || !values.vehicleType) return { ok: false, errors };
  return { ok: true, value: { plate, date: values.date, reason, vehicleType: values.vehicleType } };
}
