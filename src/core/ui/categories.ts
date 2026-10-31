import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
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

/** First path segment of a route: `/feed-entries` and `feed-entries/[id]` → `feed-entries`. */
function firstSegment(route: string): string {
  return route.replace(/^\//, '').split('/')[0];
}

/**
 * Category of the screen named `routeName` (as Expo Router names it, e.g.
 * `feed-entries/[id]`): the one of the entry whose route is its first path
 * segment. Null for the home screen and routes without an entry.
 */
export function categoryForRoute(
  routeName: string,
  entries: readonly { route: Href; category: Category }[],
): Category | null {
  const segment = firstSegment(routeName);
  if (segment === '' || segment === 'index') return null;
  const entry = entries.find((candidate) => {
    const route = typeof candidate.route === 'string' ? candidate.route : candidate.route.pathname;
    return firstSegment(route) === segment;
  });
  return entry?.category ?? null;
}
