import type { Href } from 'expo-router';

import { FEED_VISIT_SOURCE } from './repository';

/**
 * Public API of the feed entries module. It depends on the vehicles module,
 * never the other way round.
 */
export { FEED_VISIT_SOURCE };

/** Link from an automatic vehicle visit to the feed entries that created it. */
export function feedEntriesOfVisitLink(
  visit: { id: number; source: string | null },
): { label: string; href: Href } | undefined {
  if (visit.source !== FEED_VISIT_SOURCE) return undefined;
  return {
    label: 'Ver entradas de alimentos',
    href: { pathname: '/feed-entries', params: { visitId: String(visit.id) } },
  };
}
