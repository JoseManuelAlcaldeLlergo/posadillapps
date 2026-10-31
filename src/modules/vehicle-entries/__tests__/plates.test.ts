import { normalizePlate, plateKey } from '../plates';
import { PRESET_REASONS } from '../suggestions';

describe('normalizePlate', () => {
  it('uppercases and collapses spaces without validating the format', () => {
    expect(normalizePlate('  6105   hhr ')).toBe('6105 HHR');
    expect(normalizePlate('co-46336-ve')).toBe('CO-46336-VE');
    expect(normalizePlate('lo que sea')).toBe('LO QUE SEA');
  });
});

describe('plateKey', () => {
  it('ignores case, spaces and hyphens', () => {
    expect(plateKey('CO-46336-VE')).toBe('CO46336VE');
    expect(plateKey('co 46336 ve')).toBe('CO46336VE');
    expect(plateKey(' 6105 HHR ')).toBe(plateKey('6105hhr'));
    expect(plateKey('   ')).toBe('');
  });
});

describe('suggestions', () => {
  it('includes the preset reasons of the paper form', () => {
    expect(PRESET_REASONS).toContain('Transporte de pienso');
    expect(PRESET_REASONS).toHaveLength(6);
  });
});
