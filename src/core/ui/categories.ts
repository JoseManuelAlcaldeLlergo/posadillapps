import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

/** Name of a MaterialCommunityIcons glyph; TypeScript rejects unknown names. */
export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Home screen category. Each one has its own colors in the theme. */
export type Category = 'feed' | 'biosecurity' | 'hygiene' | 'settings';

/** Home screen order: settings always last. */
export const categoryOrder: readonly Category[] = ['feed', 'biosecurity', 'hygiene', 'settings'];

export const categoryLabels: Record<Category, string> = {
  feed: 'Alimentación',
  biosecurity: 'Bioseguridad',
  hygiene: 'Higiene',
  settings: 'Configuración',
};

export type CategoryGroup<T> = { category: Category; title: string; data: T[] };

/**
 * Groups items by category in `categoryOrder`, keeping each item's original
 * order inside its group and leaving out empty categories.
 */
export function groupByCategory<T extends { category: Category }>(items: readonly T[]): CategoryGroup<T>[] {
  return categoryOrder
    .map((category) => ({
      category,
      title: categoryLabels[category],
      data: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.data.length > 0);
}
