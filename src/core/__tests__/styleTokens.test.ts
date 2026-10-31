/**
 * @jest-environment node
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '../..');
const THEME = path.join(SRC, 'core/ui/theme.ts');

/** Style values that must come from `src/core/ui/theme.ts`. */
const LITERALS: { name: string; pattern: RegExp }[] = [
  { name: 'color hexadecimal', pattern: /['"`]#[0-9A-Fa-f]{3,8}['"`]/ },
  { name: 'color rgb()/rgba()', pattern: /\brgba?\(/ },
  { name: 'fontSize numérico', pattern: /\bfontSize:\s*\d/ },
  { name: 'fontWeight numérico', pattern: /\bfontWeight:\s*['"]\d/ },
  { name: 'borderRadius numérico', pattern: /\bborderRadius:\s*\d/ },
  { name: 'lineHeight numérico', pattern: /\blineHeight:\s*\d/ },
];

/** Screens and components: every .tsx, plus the .ts files of src/core/ui except the theme. */
function uiFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : uiFiles(file);
    if (file.endsWith('.tsx')) return [file];
    if (file.endsWith('.ts') && path.dirname(file) === path.dirname(THEME) && file !== THEME) {
      return [file];
    }
    return [];
  });
}

describe('style tokens', () => {
  it('finds the screens and components to check', () => {
    expect(uiFiles(SRC).length).toBeGreaterThan(50);
  });

  it('uses theme tokens instead of literal colors, font sizes and radii', () => {
    const found = uiFiles(SRC).flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, i) =>
          LITERALS.filter(({ pattern }) => pattern.test(line)).map(
            ({ name }) => `${path.relative(SRC, file)}:${i + 1} ${name}: ${line.trim()}`,
          ),
        ),
    );
    expect(found).toEqual([]);
  });
});
