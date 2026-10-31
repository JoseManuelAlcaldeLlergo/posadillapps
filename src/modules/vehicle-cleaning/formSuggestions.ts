import type { SyncDatabase } from '@/core/db/types';
import { mergeSuggestions } from '@/core/text';

import { listProductNames } from '../cleaning-disinfection';
import { listUsedPlates } from '../vehicle-entries';
import {
  frequencySuggestions,
  uniqueByPlate,
  usedPlates,
  usedProductNames,
  vehicleTypeSuggestions,
} from './repository';

export type FormSuggestions = {
  plates: string[];
  products: string[];
  vehicleTypes: string[];
  frequencies: string[];
};

export const EMPTY_SUGGESTIONS: FormSuggestions = {
  plates: [],
  products: [],
  vehicleTypes: [],
  frequencies: [],
};

/**
 * Plates of this module and of the vehicle entries module, favorite products
 * of the cleaning and disinfection module and the ones used here, vehicle
 * types and frequencies. Other modules are only read.
 */
export function loadFormSuggestions(db: SyncDatabase): FormSuggestions {
  return {
    plates: uniqueByPlate([...usedPlates(db), ...listUsedPlates(db)]),
    products: mergeSuggestions(listProductNames(db), usedProductNames(db)),
    vehicleTypes: vehicleTypeSuggestions(db),
    frequencies: frequencySuggestions(db),
  };
}
