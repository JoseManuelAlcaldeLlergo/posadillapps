import { parseYear } from '@/core/dates';
import { normalizeName } from '@/core/text';

import type { RecordFields } from './repository';
import type { TemplateInput } from './templatesRepository';

/** Raw text of the row fields, as typed by the user. */
export type FieldValues = {
  productiveUnit: string;
  action: string;
  place: string;
  result: string;
  correctiveMeasures: string;
  dateText: string;
};

export type RecordFormValues = FieldValues & { year: string };
export type TemplateFormValues = FieldValues & { active: boolean };

export type FormErrors<T> = Partial<Record<keyof T, string>>;

type Validation<T, V> = { ok: true; value: V } | { ok: false; errors: FormErrors<T> };

const REQUIRED: Record<Exclude<keyof FieldValues, 'correctiveMeasures'>, string> = {
  productiveUnit: 'Indica la unidad productiva',
  action: 'Indica la actuación',
  place: 'Indica el lugar',
  result: 'Indica el resultado',
  dateText: 'Indica la fecha o periodicidad',
};

/** Required texts present; texts normalized; empty corrective measures become null. */
export function validateFields(values: FieldValues): Validation<FieldValues, RecordFields> {
  const errors: FormErrors<FieldValues> = {};
  const value: RecordFields = {
    productiveUnit: normalizeName(values.productiveUnit),
    action: normalizeName(values.action),
    place: normalizeName(values.place),
    result: normalizeName(values.result),
    correctiveMeasures: normalizeName(values.correctiveMeasures) || null,
    dateText: normalizeName(values.dateText),
  };
  for (const [key, message] of Object.entries(REQUIRED) as [keyof typeof REQUIRED, string][]) {
    if (!value[key]) errors[key] = message;
  }
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value };
}

export function validateRecordForm(
  values: RecordFormValues,
): Validation<RecordFormValues, RecordFields & { year: number }> {
  const fields = validateFields(values);
  const year = parseYear(values.year);
  const errors: FormErrors<RecordFormValues> = fields.ok ? {} : { ...fields.errors };
  if (!values.year.trim()) errors.year = 'Indica el año';
  else if (year === null) errors.year = 'Año no válido (ejemplo: 2025)';
  if (!fields.ok || year === null) return { ok: false, errors };
  return { ok: true, value: { ...fields.value, year } };
}

export function validateTemplateForm(
  values: TemplateFormValues,
): Validation<TemplateFormValues, TemplateInput> {
  const fields = validateFields(values);
  if (!fields.ok) return fields;
  return { ok: true, value: { ...fields.value, active: values.active } };
}

/** Form texts of a row or template. */
export function toFieldValues(fields: RecordFields): FieldValues {
  return { ...fields, correctiveMeasures: fields.correctiveMeasures ?? '' };
}
