import { listProductiveUnits } from '@/core/farm';
import type { SyncDatabase } from '@/core/db/types';

import { fieldSuggestions } from './repository';

export type Suggestions = {
  productiveUnits: string[];
  actions: string[];
  places: string[];
};

/** Productive units from the farm settings; actions and places already used. */
export function loadSuggestions(db: SyncDatabase): Suggestions {
  return {
    productiveUnits: listProductiveUnits(db).map((unit) => unit.name),
    ...fieldSuggestions(db),
  };
}
