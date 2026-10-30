import { nameKey, normalizeName } from '@/core/text';

/** Usual frequencies on the paper form. */
export const PRESET_FREQUENCIES = ['A diario', 'Semanalmente', 'Según guías'];

export const PRESET_REASONS = [
  'Control y cuidado de animales',
  'Veterinario',
  'Transporte de pienso',
  'Transporte de animales',
  'Recogida de animales (venta)',
  'Vehículo particular',
];

/** Presets first, then used texts not already present (ignoring case and accents). */
export function mergeSuggestions(presets: readonly string[], used: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const text of [...presets, ...used]) {
    const clean = normalizeName(text);
    const key = nameKey(clean);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result;
}
