import ExcelJS from 'exceljs';
import type { ImportWarning } from '../import-document.types';
import type {
  ExcelColumnDef,
  ExcelDeltaCell,
  ExcelParseResult,
  ExcelParseRules,
  ExcelPreviewRow,
} from '../excel.types';
import {
  detectWizClassicMapping,
  resolveExcelColumns,
  WIZ_CLASSIC_PRESET,
} from './wiz-classic-preset';

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) {
    return '';
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value).trim();
  }
  if (typeof value === 'object' && 'richText' in value) {
    return (value.richText as Array<{ text: string }>)
      .map((part) => part.text)
      .join('');
  }
  if (typeof value === 'object' && 'text' in value) {
    return String((value as { text: string }).text ?? '');
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return '';
}

function isEmptyCell(value: ExcelJS.CellValue): boolean {
  return cellText(value) === '';
}

export async function parseExcelWorkbook(
  buffer: Buffer,
  parseRules?: ExcelParseRules,
): Promise<ExcelParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return emptyResult([
      { code: 'NO_SHEET', message: 'Workbook has no worksheets' },
    ]);
  }

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = cellText(cell.value) || `Column ${colNumber}`;
  });

  while (headers.length > 0 && headers[headers.length - 1] === '') {
    headers.pop();
  }

  if (headers.length === 0) {
    return emptyResult([
      { code: 'NO_HEADERS', message: 'No header row found in first sheet' },
    ]);
  }

  const mapping =
    parseRules?.preset === 'wiz_classic'
      ? { ...WIZ_CLASSIC_PRESET, ...parseRules.columnMapping }
      : (parseRules?.columnMapping ??
        detectWizClassicMapping(headers) ??
        undefined);

  const columns = resolveExcelColumns(headers, mapping);
  const fieldIdCol = columns.find((c) => c.role === 'fieldId');
  const keyCol = columns.find((c) => c.role === 'key');
  const sourceCol = columns.find((c) => c.role === 'source');
  const targetCols = columns.filter((c) => c.role === 'target' && c.langCode);

  const warnings: ImportWarning[] = [];
  if (!fieldIdCol || !keyCol || !sourceCol) {
    return emptyResult([
      {
        code: 'MISSING_COLUMNS',
        message: `Required columns not found. Need Field ID, Key, and source language. Headers: ${headers.join(', ')}`,
      },
    ]);
  }

  if (targetCols.length === 0) {
    warnings.push({
      code: 'NO_TARGET_LANGS',
      message: 'No target language columns detected',
    });
  }

  const protectedColumnIndexes = columns
    .filter((c) => ['fieldId', 'scope', 'key', 'source'].includes(c.role))
    .map((c) => c.index);

  const emptyCells: ExcelDeltaCell[] = [];
  const emptyCellsByLang: Record<string, number> = {};
  const filledCellsByLang: Record<string, number> = {};
  const sampleRows: ExcelPreviewRow[] = [];
  let validRows = 0;

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const fieldId = cellText(row.getCell(fieldIdCol.index + 1).value);
    const key = cellText(row.getCell(keyCol.index + 1).value);
    const sourceText = cellText(row.getCell(sourceCol.index + 1).value);
    const scopeCol = columns.find((c) => c.role === 'scope');
    const scope = scopeCol
      ? cellText(row.getCell(scopeCol.index + 1).value) || undefined
      : undefined;

    if (!fieldId && !key && !sourceText) {
      return;
    }

    if (!key || !sourceText) {
      warnings.push({
        code: 'INCOMPLETE_ROW',
        message: `Row ${rowNumber}: missing key or source text`,
        rowIndex: rowNumber,
        externalId: fieldId || undefined,
      });
      return;
    }

    validRows += 1;
    const translations: Record<string, string | null> = {};

    for (const targetCol of targetCols) {
      const lang = targetCol.langCode!;
      const cell = row.getCell(targetCol.index + 1);
      const value = cellText(cell.value);

      if (isEmptyCell(cell.value)) {
        emptyCells.push({
          row: rowNumber,
          col: targetCol.index + 1,
          fieldId: fieldId || key,
          scope,
          key,
          sourceText,
          targetLang: lang,
        });
        emptyCellsByLang[lang] = (emptyCellsByLang[lang] ?? 0) + 1;
        translations[lang] = null;
      } else {
        filledCellsByLang[lang] = (filledCellsByLang[lang] ?? 0) + 1;
        translations[lang] = value;
      }
    }

    if (sampleRows.length < 20) {
      sampleRows.push({
        rowIndex: rowNumber,
        fieldId: fieldId || key,
        scope,
        key,
        sourceText,
        translations,
      });
    }
  });

  const sourceLanguage =
    sourceCol.langCode ??
    (sourceCol.header.match(/^[a-z]{2}$/i)
      ? sourceCol.header.toLowerCase()
      : 'en');

  const targetLanguages = targetCols
    .map((c) => c.langCode!)
    .filter((lang, idx, arr) => arr.indexOf(lang) === idx);

  return {
    layout: {
      sheetName: sheet.name,
      headerRow: 1,
      columns,
      sourceLanguage,
      targetLanguages,
      emptyCells,
      protectedColumnIndexes,
    },
    stats: {
      totalRows: validRows,
      validRows,
      emptyCellsByLang,
      filledCellsByLang,
      sourceLanguage,
      targetLanguages,
      columns: headers,
    },
    warnings,
    sampleRows,
  };
}

export async function composeExcelWorkbook(
  originalBuffer: Buffer,
  layout: {
    sheetName: string;
    emptyCells: Array<{
      row: number;
      col: number;
      targetLang: string;
      jobItemId?: string;
    }>;
  },
  translationsByJobItemId: Map<string, string>,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(originalBuffer as unknown as ExcelJS.Buffer);

  const sheet =
    workbook.getWorksheet(layout.sheetName) ?? workbook.worksheets[0];
  if (!sheet) {
    throw new Error('Worksheet not found for compose');
  }

  for (const cellRef of layout.emptyCells) {
    const translated =
      cellRef.jobItemId != null
        ? translationsByJobItemId.get(cellRef.jobItemId)
        : undefined;
    if (!translated) {
      continue;
    }

    const cell = sheet.getRow(cellRef.row).getCell(cellRef.col);
    if (isEmptyCell(cell.value)) {
      cell.value = translated;
    }
  }

  const output = await workbook.xlsx.writeBuffer();
  return Buffer.from(output);
}

function emptyResult(warnings: ImportWarning[]): ExcelParseResult {
  return {
    layout: {
      sheetName: '',
      headerRow: 1,
      columns: [] as ExcelColumnDef[],
      sourceLanguage: 'en',
      targetLanguages: [],
      emptyCells: [],
      protectedColumnIndexes: [],
    },
    stats: {
      totalRows: 0,
      validRows: 0,
      emptyCellsByLang: {},
      filledCellsByLang: {},
      sourceLanguage: 'en',
      targetLanguages: [],
      columns: [],
    },
    warnings,
    sampleRows: [],
  };
}
