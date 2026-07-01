import unzipper from 'unzipper';
import type {
  ImportDocument,
  ImportRow,
  ImportSource,
  ImportSourcePage,
  ImportWarning,
} from '../import-document.types';
import { normalizeHtmlTable } from '../table-normalizer';

export async function parseConfluenceZip(
  source: ImportSource,
): Promise<ImportDocument> {
  const excluded = new Set(source.parseRules?.excludedPages ?? []);
  const allRows: ImportRow[] = [];
  const warnings: ImportWarning[] = [];
  const sourcePages: ImportSourcePage[] = [];
  const seenKeys = new Map<string, string>();

  const directory = await unzipper.Open.buffer(source.buffer);

  for (const entry of directory.files) {
    if (entry.type !== 'File') continue;
    const filename = entry.path;
    if (!filename.toLowerCase().endsWith('.html')) continue;
    if (excluded.has(filename)) continue;

    const content = await entry.buffer();
    const html = content.toString('utf8');
    const title = extractTitle(html) ?? filename;
    const { rows, warnings: pageWarnings } = normalizeHtmlTable(
      html,
      source.parseRules?.columnMapping,
      filename,
    );

    for (const row of rows) {
      const existing = seenKeys.get(row.key);
      if (existing) {
        warnings.push({
          code: 'DUPLICATE_KEY',
          message: `Duplicate key "${row.key}" in ${filename} (first seen in ${existing})`,
          externalId: row.externalId,
        });
      } else {
        seenKeys.set(row.key, filename);
      }
    }

    allRows.push(...rows);
    warnings.push(...pageWarnings);
    sourcePages.push({
      filename,
      title,
      keyCount: rows.length,
    });
  }

  if (sourcePages.length === 0) {
    warnings.push({
      code: 'NO_HTML_PAGES',
      message: 'ZIP archive contains no HTML pages',
    });
  }

  return {
    rows: allRows,
    warnings,
    stats: {
      totalRows: allRows.length,
      validRows: allRows.length,
      pageCount: sourcePages.length,
    },
    sourcePages,
  };
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim();
}

export async function streamZipEntries(
  buffer: Buffer,
): Promise<Array<{ filename: string; html: string }>> {
  const results: Array<{ filename: string; html: string }> = [];
  const directory = await unzipper.Open.buffer(buffer);
  for (const entry of directory.files) {
    if (entry.type !== 'File') continue;
    if (!entry.path.toLowerCase().endsWith('.html')) continue;
    const content = await entry.buffer();
    results.push({ filename: entry.path, html: content.toString('utf8') });
  }
  return results;
}
