/** Marker replaced by the year in a template's result and date. */
export const YEAR_PLACEHOLDER = '{año}';

/** `Mensualmente año {año}` + 2013 → `Mensualmente año 2013` */
export function fillYear(text: string, year: number): string {
  return text.split(YEAR_PLACEHOLDER).join(String(year));
}

/** `Mensualmente año 2013` + 2013 → `Mensualmente año {año}`. Only whole numbers match. */
export function toTemplateText(text: string, year: number): string {
  return text.replace(new RegExp(`(^|\\D)${year}(?!\\d)`, 'g'), `$1${YEAR_PLACEHOLDER}`);
}
