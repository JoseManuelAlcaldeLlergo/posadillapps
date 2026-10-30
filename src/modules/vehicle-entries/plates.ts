/** Uppercase with inner spaces collapsed: ` co-46336  ve ` → `CO-46336 VE`. Format is not validated. */
export function normalizePlate(plate: string): string {
  return plate.trim().replace(/\s+/g, ' ').toUpperCase();
}

/**
 * Comparison key for plates: also ignores spaces and hyphens, so
 * `CO-46336-VE`, `CO 46336 VE` and `co46336ve` match.
 */
export function plateKey(plate: string): string {
  return normalizePlate(plate).replace(/[\s-]/g, '');
}
