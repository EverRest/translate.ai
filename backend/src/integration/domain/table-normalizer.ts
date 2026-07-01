import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type {
  ColumnMapping,
  ImportRow,
  ImportWarning,
} from './import-document.types';

export interface NormalizedTableRow {
  scope?: string;
  key: string;
  sourceText: string;
  hints?: string;
}

const DEFAULT_COLUMN_ALIASES: Record<keyof Required<ColumnMapping>, string[]> =
  {
    scope: ['scope'],
    key: ['key', 'field id', 'fieldid', 'field_id'],
    sourceText: [
      'default (en)',
      'default',
      'en',
      'english',
      'source',
      'value',
      'field',
    ],
    hints: ['hints', 'hint', 'notes', 'comment'],
  };

export function normalizeHtmlTable(
  html: string,
  columnMapping?: ColumnMapping,
  externalPrefix?: string,
): { rows: ImportRow[]; warnings: ImportWarning[] } {
  const $ = cheerio.load(html);
  const table = $('table').first();
  if (!table.length) {
    return {
      rows: [],
      warnings: [
        { code: 'NO_TABLE', message: 'No HTML table found in document' },
      ],
    };
  }

  const headerCells = table.find('tr').first().find('th, td');
  const headers = headerCells
    .map((_, el) => $(el).text().trim().toLowerCase())
    .get();

  const colIndex = resolveColumnIndices(headers, columnMapping);
  if (colIndex.key < 0 || colIndex.sourceText < 0) {
    return {
      rows: [],
      warnings: [
        {
          code: 'MISSING_COLUMNS',
          message: `Required columns not found. Headers: ${headers.join(', ')}`,
        },
      ],
    };
  }

  const rows: ImportRow[] = [];
  const warnings: ImportWarning[] = [];
  let rowIndex = 0;

  table
    .find('tr')
    .slice(1)
    .each((_, tr) => {
      rowIndex += 1;
      const cells = $(tr)
        .find('td, th')
        .map((__, td) => expandCellText($(td)))
        .get();

      if (cells.length === 0) return;

      const key = (cells[colIndex.key] ?? '').trim();
      const sourceText = (cells[colIndex.sourceText] ?? '').trim();
      const scope =
        colIndex.scope >= 0 ? (cells[colIndex.scope] ?? '').trim() : undefined;
      const hints =
        colIndex.hints >= 0 ? (cells[colIndex.hints] ?? '').trim() : undefined;

      if (!key && !sourceText) return;

      if (!key || !sourceText) {
        warnings.push({
          code: 'INVALID_ROW',
          message: 'Row missing key or source text',
          rowIndex,
        });
        return;
      }

      rows.push({
        scope: scope || undefined,
        key,
        sourceText,
        hints: hints || undefined,
        externalId: externalPrefix
          ? `${externalPrefix}#row-${rowIndex}`
          : undefined,
        externalSource: externalPrefix ? 'confluence' : undefined,
      });
    });

  return { rows, warnings };
}

function expandCellText(cell: cheerio.Cheerio<AnyNode>): string {
  const rowspan = parseInt(cell.attr('rowspan') ?? '1', 10);
  const text = cell.text().replace(/\s+/g, ' ').trim();
  if (rowspan > 1 && text) {
    return text;
  }
  return text;
}

function resolveColumnIndices(
  headers: string[],
  mapping?: ColumnMapping,
): { scope: number; key: number; sourceText: number; hints: number } {
  const findCol = (names: string[], explicit?: string): number => {
    if (explicit) {
      const idx = headers.indexOf(explicit.toLowerCase());
      if (idx >= 0) return idx;
    }
    for (const name of names) {
      const idx = headers.findIndex((h) => h === name || h.includes(name));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  return {
    scope: findCol(DEFAULT_COLUMN_ALIASES.scope, mapping?.scope),
    key: findCol(DEFAULT_COLUMN_ALIASES.key, mapping?.key),
    sourceText: findCol(DEFAULT_COLUMN_ALIASES.sourceText, mapping?.sourceText),
    hints: findCol(DEFAULT_COLUMN_ALIASES.hints, mapping?.hints),
  };
}

export function normalizeCsvTable(
  csvText: string,
  columnMapping?: ColumnMapping,
  externalPrefix?: string,
): { rows: ImportRow[]; warnings: ImportWarning[] } {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return {
      rows: [],
      warnings: [{ code: 'EMPTY_CSV', message: 'CSV has no data rows' }],
    };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const colIndex = resolveColumnIndices(headers, columnMapping);
  if (colIndex.key < 0 || colIndex.sourceText < 0) {
    return {
      rows: [],
      warnings: [
        {
          code: 'MISSING_COLUMNS',
          message: `Required columns not found. Headers: ${headers.join(', ')}`,
        },
      ],
    };
  }

  const rows: ImportRow[] = [];
  const warnings: ImportWarning[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const key = (cells[colIndex.key] ?? '').trim();
    const sourceText = (cells[colIndex.sourceText] ?? '').trim();
    const scope =
      colIndex.scope >= 0 ? (cells[colIndex.scope] ?? '').trim() : undefined;
    const hints =
      colIndex.hints >= 0 ? (cells[colIndex.hints] ?? '').trim() : undefined;

    if (!key && !sourceText) continue;

    if (!key || !sourceText) {
      warnings.push({
        code: 'INVALID_ROW',
        message: 'Row missing key or source text',
        rowIndex: i,
      });
      continue;
    }

    rows.push({
      scope: scope || undefined,
      key,
      sourceText,
      hints: hints || undefined,
      externalId: externalPrefix ? `${externalPrefix}#row-${i}` : undefined,
      externalSource: externalPrefix ? 'confluence' : undefined,
    });
  }

  return { rows, warnings };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
