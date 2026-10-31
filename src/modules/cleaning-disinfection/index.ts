import type { SyncDatabase } from '@/core/db/types';

import { listProducts } from './productsRepository';

/**
 * Public API of the cleaning and disinfection module. It only uses the farm
 * settings from `src/core/farm`. The vehicle cleaning module reads its
 * product names as suggestions, never the other way round.
 */
export type { CleaningApplication, CleaningProduct, CleaningRegular } from './schema';

/** Names of the favorite products, alphabetically. Read-only. */
export function listProductNames(db: SyncDatabase): string[] {
  return listProducts(db).map((product) => product.name);
}
