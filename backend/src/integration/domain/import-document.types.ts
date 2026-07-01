export interface ImportWarning {
  code: string;
  message: string;
  rowIndex?: number;
  externalId?: string;
}

export interface ImportSourcePage {
  filename: string;
  title?: string;
  keyCount: number;
}

export interface ImportRow {
  scope?: string;
  key: string;
  sourceText: string;
  hints?: string;
  externalId?: string;
  externalSource?: string;
  metadata?: Record<string, string>;
}

export interface ImportStats {
  totalRows: number;
  validRows: number;
  pageCount?: number;
}

export interface ImportDocument {
  rows: ImportRow[];
  warnings: ImportWarning[];
  stats: ImportStats;
  sourcePages?: ImportSourcePage[];
}

export interface ImportDiffSummary {
  create: number;
  update: number;
  unchanged: number;
  conflict: number;
  invalid: number;
  skip: number;
}

export interface ImportDiffItem {
  row: ImportRow;
  action: 'create' | 'update' | 'unchanged' | 'conflict' | 'invalid' | 'skip';
  error?: string;
  warning?: string;
  before?: { sourceText: string; context: string | null };
  after?: { sourceText: string; context: string | null };
}

export type ImportSourceType =
  | 'confluence_html'
  | 'confluence_csv'
  | 'confluence_zip'
  | 'paste_html';

export interface ColumnMapping {
  scope?: string;
  key?: string;
  sourceText?: string;
  hints?: string;
}

export interface ParseRules {
  columnMapping?: ColumnMapping;
  excludedPages?: string[];
}

export interface ImportSource {
  type: ImportSourceType;
  buffer: Buffer;
  filename?: string;
  parseRules?: ParseRules;
}
