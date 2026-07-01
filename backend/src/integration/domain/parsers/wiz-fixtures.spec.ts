import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseConfluenceCsv } from './confluence-csv.parser';
import { parseConfluenceZip } from './confluence-zip.parser';

const wizFixturesDir = join(
  __dirname,
  '../../../../test/fixtures/confluence/wiz',
);

describe('wiz production fixtures', () => {
  const hasWizFixtures =
    existsSync(join(wizFixturesDir, 'sample.csv')) ||
    existsSync(join(wizFixturesDir, 'sample.html')) ||
    existsSync(join(wizFixturesDir, 'sample.zip'));

  (hasWizFixtures ? it : it.skip)(
    'parses anonymized Wiz export fixtures when present',
    async () => {
      const csvPath = join(wizFixturesDir, 'sample.csv');
      if (existsSync(csvPath)) {
        const doc = parseConfluenceCsv({
          type: 'confluence_csv',
          buffer: readFileSync(csvPath),
        });
        expect(doc.rows.length).toBeGreaterThan(0);
      }

      const zipPath = join(wizFixturesDir, 'sample.zip');
      if (existsSync(zipPath)) {
        const doc = await parseConfluenceZip({
          type: 'confluence_zip',
          buffer: readFileSync(zipPath),
        });
        expect(doc.rows.length).toBeGreaterThan(0);
      }
    },
  );
});
