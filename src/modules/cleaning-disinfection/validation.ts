import { parseIsoDate } from '@/core/export/format';
import { normalizeName } from '@/core/text';

import type { ProductInput } from './productsRepository';
import type { ApplicationInput, RecordFields, RegularInput } from './repository';

/** Raw form state of the shared fields, as typed by the user. */
export type FieldValues = {
  productiveUnit: string;
  productName: string;
  place: string;
  waitingDays: string;
  /** ISO date, or null if empty. */
  reviewDate: string | null;
};

export type ApplicationFormValues = FieldValues & { date: string };
export type RegularFormValues = FieldValues & { frequency: string; active: boolean };

export type ProductFormValues = {
  name: string;
  defaultWaitingDays: string;
  defaultPlace: string;
};

export type FormErrors<Values> = Partial<Record<keyof Values, string>>;

export type Validation<Values, Input> =
  | { ok: true; value: Input }
  | { ok: false; errors: FormErrors<Values> };

const WAITING_DAYS = /^\d{1,4}$/;

/** Whole days, 0 or more: `15` → 15; empty or invalid → null. */
export function parseWaitingDays(text: string): number | null {
  const clean = text.trim();
  return WAITING_DAYS.test(clean) ? Number(clean) : null;
}

function waitingDaysError(text: string): string | undefined {
  if (!text.trim()) return 'Indica el periodo de espera (0 si no tiene)';
  return parseWaitingDays(text) === null ? 'Escribe un número entero de días' : undefined;
}

function dateError(iso: string | null, required: string | null): string | undefined {
  if (!iso) return required ?? undefined;
  try {
    parseIsoDate(iso);
    return undefined;
  } catch {
    return 'Fecha no válida';
  }
}

function validateFields(values: FieldValues): Validation<FieldValues, RecordFields> {
  const errors: FormErrors<FieldValues> = {};
  const productiveUnit = normalizeName(values.productiveUnit);
  const productName = normalizeName(values.productName);
  const place = normalizeName(values.place);
  const waitingDays = parseWaitingDays(values.waitingDays);

  if (!productiveUnit) errors.productiveUnit = 'Indica la unidad productiva';
  if (!productName) errors.productName = 'Indica el producto empleado';
  if (!place) errors.place = 'Indica el lugar de aplicación';
  const waitingError = waitingDaysError(values.waitingDays);
  if (waitingError) errors.waitingDays = waitingError;
  const reviewError = dateError(values.reviewDate, null);
  if (reviewError) errors.reviewDate = reviewError;

  if (Object.keys(errors).length > 0 || waitingDays === null) return { ok: false, errors };
  return {
    ok: true,
    value: { productiveUnit, productName, place, waitingDays, reviewDate: values.reviewDate || null },
  };
}

export function validateApplicationForm(
  values: ApplicationFormValues,
): Validation<ApplicationFormValues, ApplicationInput> {
  const fields = validateFields(values);
  const errors: FormErrors<ApplicationFormValues> = fields.ok ? {} : { ...fields.errors };
  const date = dateError(values.date, 'Indica la fecha');
  if (date) errors.date = date;
  if (!fields.ok || date) return { ok: false, errors };
  return { ok: true, value: { ...fields.value, date: values.date } };
}

export function validateRegularForm(
  values: RegularFormValues,
): Validation<RegularFormValues, RegularInput> {
  const fields = validateFields(values);
  const errors: FormErrors<RegularFormValues> = fields.ok ? {} : { ...fields.errors };
  const frequency = normalizeName(values.frequency);
  if (!frequency) errors.frequency = 'Indica la frecuencia';
  if (!fields.ok || !frequency) return { ok: false, errors };
  return { ok: true, value: { ...fields.value, frequency, active: values.active } };
}

export function validateProductForm(
  values: ProductFormValues,
): Validation<ProductFormValues, ProductInput> {
  const errors: FormErrors<ProductFormValues> = {};
  const name = normalizeName(values.name);
  const defaultWaitingDays = parseWaitingDays(values.defaultWaitingDays);
  if (!name) errors.name = 'Escribe el nombre del producto';
  const waitingError = waitingDaysError(values.defaultWaitingDays);
  if (waitingError) errors.defaultWaitingDays = waitingError;
  if (Object.keys(errors).length > 0 || defaultWaitingDays === null) return { ok: false, errors };
  return {
    ok: true,
    value: { name, defaultWaitingDays, defaultPlace: normalizeName(values.defaultPlace) || null },
  };
}

/** Form texts of a saved record. */
export function toFieldValues(fields: RecordFields): FieldValues {
  return {
    productiveUnit: fields.productiveUnit,
    productName: fields.productName,
    place: fields.place,
    waitingDays: String(fields.waitingDays),
    reviewDate: fields.reviewDate,
  };
}
