import { parseIsoDate } from '@/core/export/format';
import { parseDecimal } from '@/core/numbers';

import { normalizePlate } from '../vehicle-entries';
import { normalizeName } from './names';
import type { EntryInput } from './repository';
import type { FeedUnit } from './units';

/** Raw form state, as typed by the user. */
export type EntryFormValues = {
  date: string;
  quantity: string;
  unit: FeedUnit;
  supplierName: string;
  feedName: string;
  invoice: string;
  truckPlate: string;
};

export type EntryFormErrors = Partial<Record<keyof EntryFormValues, string>>;

export type EntryValidation =
  | { ok: true; value: EntryInput }
  | { ok: false; errors: EntryFormErrors };

export function validateEntryForm(values: EntryFormValues): EntryValidation {
  const errors: EntryFormErrors = {};

  if (!values.date) {
    errors.date = 'Indica la fecha';
  } else {
    try {
      parseIsoDate(values.date);
    } catch {
      errors.date = 'Fecha no válida';
    }
  }

  const quantity = parseDecimal(values.quantity);
  if (!values.quantity.trim()) {
    errors.quantity = 'Indica la cantidad';
  } else if (quantity === null) {
    errors.quantity = 'Cantidad no válida (ejemplo: 9.340 o 1.234,5)';
  } else if (quantity <= 0) {
    errors.quantity = 'La cantidad debe ser mayor que 0';
  }

  const supplierName = normalizeName(values.supplierName);
  if (!supplierName) errors.supplierName = 'Indica el proveedor';

  const feedName = normalizeName(values.feedName);
  if (!feedName) errors.feedName = 'Indica la denominación comercial del pienso';

  if (Object.keys(errors).length > 0 || quantity === null) {
    return { ok: false, errors };
  }

  const invoice = normalizeName(values.invoice);
  const truckPlate = normalizePlate(values.truckPlate);
  return {
    ok: true,
    value: {
      date: values.date,
      quantity,
      unit: values.unit,
      supplierName,
      feedName,
      invoice: invoice || null,
      truckPlate: truckPlate || null,
    },
  };
}
