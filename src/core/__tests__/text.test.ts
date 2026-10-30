import { findByName, nameKey, normalizeName } from '../text';

describe('text', () => {
  it('normalizes spaces', () => {
    expect(normalizeName('  Mezclas   del\tValle ')).toBe('Mezclas del Valle');
  });

  it('builds a key ignoring case, accents and spaces', () => {
    expect(nameKey(' Denominación  Comercial ')).toBe('denominacion comercial');
    expect(nameKey('Sierra de los Santos SCA')).toBe(nameKey('sierra de los santos sca'));
  });

  it('finds items by name', () => {
    const list = [
      { id: 1, name: 'Mezclas del Valle' },
      { id: 2, name: 'Sierra de los Santos SCA' },
    ];
    expect(findByName(list, 'mezclas del valle')?.id).toBe(1);
    expect(findByName(list, 'Otro')).toBeUndefined();
    expect(findByName(list, '  ')).toBeUndefined();
  });
});
