import { buildPdfHtml, escapeHtml, pageSize } from '../pdf';
import { sampleRows, sampleTable } from './fixtures/sampleTable';

function bodyRows(html: string): string[] {
  const tbody = /<tbody>([\s\S]*)<\/tbody>/.exec(html)?.[1] ?? '';
  return tbody.match(/<tr>[\s\S]*?<\/tr>/g) ?? [];
}

describe('buildPdfHtml', () => {
  const html = buildPdfHtml(sampleTable, sampleRows);

  it('uses A4 with the table orientation', () => {
    expect(html).toContain('@page { size: A4 landscape;');
    expect(buildPdfHtml({ ...sampleTable, orientation: 'portrait' }, [])).toContain(
      '@page { size: A4 portrait;',
    );
  });

  it('puts headers in order inside thead so they repeat on every page', () => {
    expect(html).toContain(
      '<thead><tr><th>FECHA</th><th>CANTIDAD</th><th>DESCRIPCIÓN</th><th>REFERENCIA</th></tr></thead>',
    );
    expect(html).toContain('thead { display: table-header-group; }');
  });

  it('draws borders on every cell and bold centered headers', () => {
    expect(html).toContain('border-collapse: collapse');
    expect(html).toContain('th, td { border: 1px solid #000;');
    expect(html).toContain('th { font-weight: bold; text-align: center; }');
  });

  it('sorts rows with compareRows and formats cells', () => {
    const rows = bodyRows(html);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toContain('<td class="center">31-01-2025</td>');
    expect(rows[0]).toContain('<td class="right">1.234,5 kg</td>');
    expect(rows[1]).toContain('<td class="center">28-02-2025</td>');
    expect(rows[1]).toContain('<td class="right">750 l</td>');
    expect(rows[2]).toContain('<td class="center">31-03-2025</td>');
    expect(rows[2]).toContain('<td class="right">9.340 kg</td>');
    expect(rows[2]).toContain('<td class="left">F2000 525</td>');
  });

  it('escapes HTML and renders empty text cells', () => {
    const [first] = bodyRows(html);
    expect(first).toContain('<td class="left">Producto &lt;B&gt; &amp; C</td>');
    expect(first).toContain('<td class="left"></td>');
  });

  it('does not mutate the input rows', () => {
    expect(sampleRows[0].date).toBe('2025-03-31');
  });

  it('sizes columns proportionally to their width', () => {
    // 12 / (12 + 14 + 40 + 18) = 14.29 %
    expect(html).toContain('<col style="width:14.29%">');
  });

  it('renders only the header when there are no rows', () => {
    const empty = buildPdfHtml(sampleTable, []);
    expect(empty).toContain('<th>FECHA</th>');
    expect(bodyRows(empty)).toHaveLength(0);
  });
});

describe('pageSize', () => {
  it('returns A4 in points', () => {
    expect(pageSize('landscape')).toEqual({ width: 842, height: 595 });
    expect(pageSize('portrait')).toEqual({ width: 595, height: 842 });
  });
});

describe('escapeHtml', () => {
  it('escapes special characters', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });
});
