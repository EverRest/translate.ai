import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeCsvTable, normalizeHtmlTable } from './table-normalizer';

const fixturesDir = join(__dirname, '../../../test/fixtures/confluence');

describe('table-normalizer', () => {
  describe('normalizeHtmlTable', () => {
    it('parses sample HTML fixture rows', () => {
      const html = readFileSync(join(fixturesDir, 'sample.html'), 'utf8');
      const { rows, warnings } = normalizeHtmlTable(html);

      expect(warnings).toHaveLength(0);
      expect(rows).toHaveLength(3);
      expect(rows[0]).toMatchObject({
        scope: 'BMA/Login',
        key: 'login.title',
        sourceText: 'Sign in',
        hints: 'Shown on login page header',
      });
      expect(rows[1].hints).toContain('%%userName%%');
    });

    it('returns warning when no table found', () => {
      const { rows, warnings } = normalizeHtmlTable('<p>No table</p>');
      expect(rows).toHaveLength(0);
      expect(warnings[0]?.code).toBe('NO_TABLE');
    });
  });

  describe('normalizeCsvTable', () => {
    it('parses sample CSV fixture rows', () => {
      const csv = readFileSync(join(fixturesDir, 'sample.csv'), 'utf8');
      const { rows, warnings } = normalizeCsvTable(csv);

      expect(warnings).toHaveLength(0);
      expect(rows).toHaveLength(3);
      expect(rows[2]).toMatchObject({
        scope: 'PMA/Settings',
        key: 'settings.save',
        sourceText: 'Save changes',
      });
    });

    it('handles quoted CSV fields', () => {
      const csv = 'Scope,Key,Default (EN),Hints\nA,k1,Text,"hint, with comma"';
      const { rows } = normalizeCsvTable(csv);
      expect(rows[0]?.hints).toBe('hint, with comma');
    });
  });
});
