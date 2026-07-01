import type { ImportDocument, ImportSource } from '../import-document.types';
import { normalizeCsvTable } from '../table-normalizer';

export function parseConfluenceCsv(source: ImportSource): ImportDocument {
  const csvText = source.buffer.toString('utf8');
  const { rows, warnings } = normalizeCsvTable(
    csvText,
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
