/** Usual frequencies of periodic cleanings on the paper form. */
export const PRESET_FREQUENCIES = ['A diario', 'Semanalmente', 'Mensualmente'];

export const PRESET_VEHICLE_TYPES = ['Particular', 'Turismo', 'Camión', 'Tractor', 'Remolque'];

/** Default review text of a periodic cleaning: `Semanalmente` + 2023 → `Semanalmente 2023`. */
export function defaultReviewText(frequency: string, year: number): string {
  return `${frequency} ${year}`;
}
