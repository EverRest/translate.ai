import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseConfluenceCsv } from './confluence-csv.parser';
import { parseConfluenceZip } from './confluence-zip.parser';
import { parseImportSource } from './import-parser.registry';

const fixturesDir = join(__dirname, '../../../../test/fixtures/confluence');

describe('confluence parsers', () => {
  it('parseConfluenceCsv returns document stats', () => {
    const buffer = readFileSync(join(fixturesDir, 'sample.csv'));
    const doc = parseConfluenceCsv({ type: 'confluence_csv', buffer });
    expect(doc.stats.totalRows).toBe(3);
    expect(doc.rows[1]?.key).toBe('login.submit');
  });

  it('parseConfluenceZip merges HTML pages', async () => {
    const buffer = readFileSync(join(fixturesDir, 'sample.zip'));
    const doc = await parseConfluenceZip({ type: 'confluence_zip', buffer });
    expect(doc.stats.pageCount).toBe(2);
    expect(doc.rows.length).toBe(4);
    expect(doc.rows.some((row) => row.key === 'checkout.pay')).toBe(true);
  });

  it('parseImportSource handles HTML', async () => {
    const buffer = readFileSync(join(fixturesDir, 'sample.html'));
    const doc = await parseImportSource({
      type: 'confluence_html',
      buffer,
    });
    expect(doc.rows).toHaveLength(3);
  });

  it('large-demo CSV has 850 rows', () => {
    const buffer = readFileSync(join(fixturesDir, 'large-demo.csv'));
    const doc = parseConfluenceCsv({ type: 'confluence_csv', buffer });
    expect(doc.stats.totalRows).toBe(850);
  });
});
