/** Trims and collapses inner whitespace: `  Mezclas   del Valle ` → `Mezclas del Valle`. */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Comparison key for favorites: ignores case, accents and extra spaces, so
 * `mezclas del valle` matches `Mezclas del Valle`.
 */
export function nameKey(name: string): string {
  return normalizeName(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Item of `list` whose name matches `name` by `nameKey`. */
export function findByName<T extends { name: string }>(list: readonly T[], name: string): T | undefined {
  const key = nameKey(name);
  return key ? list.find((item) => nameKey(item.name) === key) : undefined;
}
