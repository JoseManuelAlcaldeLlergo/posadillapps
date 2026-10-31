import { formatCell } from '../format';
import {
  compareRegularsFirst,
  isRegularRow,
  regularOrDateCell,
  type RegularOrDatedRow,
} from '../regulars';

const regular = (id: number, frequency: string): RegularOrDatedRow => ({ kind: 'regular', id, frequency });
const dated = (id: number, date: string): RegularOrDatedRow => ({ kind: 'application', id, date });

describe('regular and dated export rows', () => {
  it('tells regular rows apart by kind', () => {
    expect(isRegularRow(regular(1, 'A diario'))).toBe(true);
    expect(isRegularRow(dated(1, '2025-01-01'))).toBe(false);
  });

  it('puts the frequency or the real date in the FECHA cell', () => {
    expect(regularOrDateCell(regular(1, 'A diario'))).toEqual({ kind: 'text', value: 'A diario' });
    expect(regularOrDateCell(dated(1, '2025-03-05'))).toEqual({ kind: 'date', iso: '2025-03-05' });
    expect(formatCell(regularOrDateCell(dated(1, '2025-03-05')), '/')).toBe('05/03/2025');
  });

  it('sorts regular rows first by id, then dated rows by date and id', () => {
    const rows = [
      dated(3, '2025-02-01'),
      regular(2, 'Semanalmente'),
      dated(2, '2025-01-15'),
      regular(1, 'A diario'),
      dated(1, '2025-01-15'),
    ];
    expect([...rows].sort(compareRegularsFirst).map((row) => `${row.kind}${row.id}`)).toEqual([
      'regular1',
      'regular2',
      'application1',
      'application2',
      'application3',
    ]);
  });
});
