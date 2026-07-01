import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { detectImportFormat } from './format-detector';

const fixturesDir = join(__dirname, '../../../test/fixtures/confluence');

describe('format-detector', () => {
  it('detects CSV by extension', () => {
    const buffer = readFileSync(join(fixturesDir, 'sample.csv'));
    expect(detectImportFormat(buffer, 'export.csv')).toEqual({
      sourceType: 'confluence_csv',
      mimeHint: 'text/csv',
    });
  });

  it('detects HTML by extension', () => {
    const buffer = readFileSync(join(fixturesDir, 'sample.html'));
    expect(detectImportFormat(buffer, 'page.html')).toEqual({
      sourceType: 'confluence_html',
      mimeHint: 'text/html',
    });
  });

  it('detects ZIP by magic bytes', () => {
    const buffer = readFileSync(join(fixturesDir, 'sample.zip'));
    expect(detectImportFormat(buffer, 'archive.zip')).toEqual({
      sourceType: 'confluence_zip',
      mimeHint: 'application/zip',
    });
  });

  it('detects paste_html via explicit type', () => {
    const buffer = Buffer.from('<table></table>');
    expect(detectImportFormat(buffer, 'paste.html', 'paste_html')).toEqual({
      sourceType: 'paste_html',
      mimeHint: 'text/html',
    });
  });

  it('throws for unsupported binary', () => {
    expect(() =>
      detectImportFormat(Buffer.from([0, 1, 2, 3]), 'data.bin'),
    ).toThrow(/Unsupported import format/);
  });
});
