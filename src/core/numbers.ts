const GROUPED_THOUSANDS = /^\d{1,3}(\.\d{3})+$/;
const PLAIN_DECIMAL = /^\d+([.,]\d+)?$/;

/**
 * Parses a number typed in Spanish format. Accepts `9340`, `9.340`,
 * `1.234,5`, `1234,5` and also `1234.5`. Dots are thousands separators when
 * they group exactly 3 digits (`9.340` is 9340). Returns `null` if invalid.
 */
export function parseDecimal(text: string): number | null {
  const value = text.trim().replace(/\s/g, '');
  if (!value) return null;

  let normalized: string;
  if (value.includes(',')) {
    const [integerPart, ...rest] = value.split(',');
    if (rest.length !== 1) return null;
    const integer = integerPart.includes('.')
      ? GROUPED_THOUSANDS.test(integerPart)
        ? integerPart.replace(/\./g, '')
        : null
      : integerPart;
    if (integer === null) return null;
    normalized = `${integer}.${rest[0]}`;
  } else if (GROUPED_THOUSANDS.test(value)) {
    normalized = value.replace(/\./g, '');
  } else {
    normalized = value;
  }

  if (!PLAIN_DECIMAL.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

/** Number as shown in an editable field: no thousands separator, decimal comma. */
export function formatDecimalInput(value: number): string {
  return String(value).replace('.', ',');
}
