import { fillYear, toTemplateText, YEAR_PLACEHOLDER } from '../templates';

describe('fillYear', () => {
  it('replaces every marker with the year', () => {
    expect(fillYear('Mensualmente año {año}', 2013)).toBe('Mensualmente año 2013');
    expect(fillYear('{año} y {año}', 2025)).toBe('2025 y 2025');
    expect(fillYear('Mensualmente', 2025)).toBe('Mensualmente');
  });
});

describe('toTemplateText', () => {
  it('turns the year back into the marker, only as a whole number', () => {
    expect(toTemplateText('1 de cada mes 2013', 2013)).toBe(`1 de cada mes ${YEAR_PLACEHOLDER}`);
    expect(toTemplateText('2013: revisión', 2013)).toBe('{año}: revisión');
    expect(toTemplateText('Lote 20134 de 2013', 2013)).toBe('Lote 20134 de {año}');
    expect(toTemplateText('Mensualmente', 2013)).toBe('Mensualmente');
  });

  it('round-trips with fillYear', () => {
    const text = 'Mensualmente año 2013';
    expect(fillYear(toTemplateText(text, 2013), 2014)).toBe('Mensualmente año 2014');
  });
});
