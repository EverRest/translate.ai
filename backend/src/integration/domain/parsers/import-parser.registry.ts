import type { ImportDocument, ImportSource } from '../import-document.types';
import { parseConfluenceCsv } from './confluence-csv.parser';
import { parseConfluenceZip } from './confluence-zip.parser';
import { normalizeHtmlTable } from '../table-normalizer';

function parseConfluenceHtml(source: ImportSource): ImportDocument {
  const html = source.buffer.toString('utf8');
  const { rows, warnings } = normalizeHtmlTable(
    html,
    source.parseRules?.columnMapping,
  );

  return {
    rows,
    warnings,
    stats: {
      totalRows: rows.length,
      validRows: rows.length,
    },
  };
}

export async function parseImportSource(
  source: ImportSource,
): Promise<ImportDocument> {
  switch (source.type) {
    case 'confluence_html':
    case 'paste_html':
      return parseConfluenceHtml(source);
    case 'confluence_csv':
      return parseConfluenceCsv(source);
    case 'confluence_zip':
      return parseConfluenceZip(source);
    default:
      throw new Error(`Unsupported source type: ${source.type as string}`);
  }
}
