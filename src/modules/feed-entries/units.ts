export const FEED_UNITS = ['kg', 't', 'l'] as const;

export type FeedUnit = (typeof FEED_UNITS)[number];

export const DEFAULT_FEED_UNIT: FeedUnit = 'kg';

export function isFeedUnit(value: string): value is FeedUnit {
  return (FEED_UNITS as readonly string[]).includes(value);
}
