import { newYearRows, previewYearRows } from '../yearGeneration';

type Source = { id: number; name: string };

const sources: Source[] = [
  { id: 1, name: 'A' },
  { id: 2, name: 'B' },
  { id: 3, name: 'C' },
];

describe('previewYearRows', () => {
  it('proposes one row per source, in order, skipping taken ones', () => {
    const preview = previewYearRows(
      sources,
      new Set([2]),
      (source) => source.id,
      (source) => ({ sourceId: source.id, text: `${source.name} 2023` }),
    );
    expect(preview.rows).toEqual([
      { sourceId: 1, text: 'A 2023' },
      { sourceId: 3, text: 'C 2023' },
    ]);
    expect(preview.skipped).toEqual([{ id: 2, name: 'B' }]);
  });

  it('accepts text keys', () => {
    const preview = previewYearRows(sources, new Set(['b']), (s) => s.name.toLowerCase(), (s) => s.id);
    expect(preview.rows).toEqual([1, 3]);
  });
});

describe('newYearRows', () => {
  it('keeps rows whose source is free, once per source, and marks them taken', () => {
    const taken = new Set([2]);
    const rows = [{ sourceId: 1 }, { sourceId: 2 }, { sourceId: 1 }, { sourceId: 3 }];
    expect(newYearRows(rows, taken, (row) => row.sourceId)).toEqual([{ sourceId: 1 }, { sourceId: 3 }]);
    expect([...taken].sort()).toEqual([1, 2, 3]);
  });
});
