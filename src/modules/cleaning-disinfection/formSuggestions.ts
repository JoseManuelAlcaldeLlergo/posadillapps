import type { SyncDatabase } from '@/core/db/types';
import { listProductiveUnits } from '@/core/farm';

import { listProducts } from './productsRepository';
import { frequencySuggestions, lastProductiveUnit, placeSuggestions } from './repository';
import type { CleaningProduct } from './schema';

export type FormSuggestions = {
  products: CleaningProduct[];
  productiveUnits: string[];
  places: string[];
  frequencies: string[];
};

export const EMPTY_SUGGESTIONS: FormSuggestions = {
  products: [],
  productiveUnits: [],
  places: [],
  frequencies: [],
};

/** Favorite products, productive units from the farm settings, places and frequencies. */
export function loadFormSuggestions(db: SyncDatabase): FormSuggestions {
  return {
    products: listProducts(db),
    productiveUnits: listProductiveUnits(db).map((unit) => unit.name),
    places: placeSuggestions(db),
    frequencies: frequencySuggestions(db),
  };
}

/** Productive unit for a new record: the last one used, else the first in the farm settings. */
export function defaultProductiveUnit(db: SyncDatabase): string {
  return lastProductiveUnit(db) ?? listProductiveUnits(db)[0]?.name ?? '';
}
