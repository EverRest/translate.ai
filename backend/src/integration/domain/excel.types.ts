import type { ImportWarning } from './import-document.types';

export type ExcelColumnRole =
  | 'fieldId'
  | 'scope'
  | 'key'
  | 'source'
  | 'target'
  | 'unknown';

export interface ExcelColumnDef {
  index: number;
  header: string;
  role: ExcelColumnRole;
  langCode?: string;
}

export interface ExcelDeltaCell {
  row: number;
  col: number;
  fieldId: string;
  scope?: string;
  key: string;
  sourceText: string;
  targetLang: string;
  existingValue?: string;
}

export interface ExcelDeltaItem extends ExcelDeltaCell {
  jobItemId?: string;
  translationKeyId?: string;
}

export interface ExcelLayout {
  sheetName: string;
  headerRow: number;
  columns: ExcelColumnDef[];
  sourceLanguage: string;
  targetLanguages: string[];
  emptyCells: ExcelDeltaCell[];
  protectedColumnIndexes: number[];
}

export interface ExcelImportStats {
  totalRows: number;
  validRows: number;
  emptyCellsByLang: Record<string, number>;
  filledCellsByLang: Record<string, number>;
  sourceLanguage: string;
  targetLanguages: string[];
  columns: string[];
}

export interface ExcelParseResult {
  layout: ExcelLayout;
  stats: ExcelImportStats;
  warnings: ImportWarning[];
  sampleRows: ExcelPreviewRow[];
}

export interface ExcelPreviewRow {
  rowIndex: number;
  fieldId: string;
  scope?: string;
  key: string;
  sourceText: string;
  translations: Record<string, string | null>;
}

export type ExcelImportPreset = 'wiz_classic' | 'custom';

export interface ExcelColumnMapping {
  fieldId?: string;
  scope?: string;
  key?: string;
  sourceLang?: string;
  targetLangColumns?: Record<string, string>;
}

export interface ExcelParseRules {
  preset?: ExcelImportPreset;
  columnMapping?: ExcelColumnMapping;
}

export interface ExcelImportProfile {
  preset: ExcelImportPreset;
  columnMapping?: ExcelColumnMapping;
}
