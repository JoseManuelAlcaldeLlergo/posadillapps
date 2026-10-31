import { parseYear, type DateRange } from '../dates';
import type { YearRange } from './types';

/** Period as entered on the export screen, before validation. */
export type PeriodInput =
  | { type: 'dateRange'; from: string | null; to: string | null }
  | { type: 'yearRange'; from: string; to: string };

export type ResolvedPeriod =
  | { ok: true; period: DateRange | YearRange }
  | { ok: false; reason: 'incomplete' | 'invalidYear' | 'reversed' };

/** Validates the entered period: both ends present, valid and in order (inclusive). */
export function resolvePeriod(input: PeriodInput): ResolvedPeriod {
  if (input.type === 'dateRange') {
    const { from, to } = input;
    if (!from || !to) return { ok: false, reason: 'incomplete' };
    if (from > to) return { ok: false, reason: 'reversed' };
    return { ok: true, period: { from, to } };
  }
  if (!input.from.trim() || !input.to.trim()) return { ok: false, reason: 'incomplete' };
  const fromYear = parseYear(input.from);
  const toYear = parseYear(input.to);
  if (fromYear === null || toYear === null) return { ok: false, reason: 'invalidYear' };
  if (fromYear > toYear) return { ok: false, reason: 'reversed' };
  return { ok: true, period: { fromYear, toYear } };
}
