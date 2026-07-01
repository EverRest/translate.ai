export type ExcelImportSessionStatus =
  | 'pending'
  | 'parsing'
  | 'preview_ready'
  | 'translating'
  | 'composing'
  | 'download_ready'
  | 'failed';

export type ExcelImportStats = {
  totalRows: number;
  validRows: number;
  emptyCellsByLang: Record<string, number>;
  filledCellsByLang: Record<string, number>;
  sourceLanguage: string;
  targetLanguages: string[];
  columns: string[];
};

export type ExcelPreviewRow = {
  rowIndex: number;
  fieldId: string;
  scope?: string;
  key: string;
  sourceText: string;
  translations: Record<string, string | null>;
};

export type ExcelImportSession = {
  id: string;
  projectId: string;
  sourceType: string;
  status: ExcelImportSessionStatus;
  stats: ExcelImportStats | null;
  warnings: Array<{ code: string; message: string }> | null;
  sampleRows: ExcelPreviewRow[];
  originalFilename: string | null;
  translationJobId: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  queued?: boolean;
};

export type ExcelImportProfile = {
  preset: 'wiz_classic' | 'custom';
  columnMapping?: {
    fieldId?: string;
    scope?: string;
    key?: string;
    sourceLang?: string;
    targetLangColumns?: Record<string, string>;
  };
};

export const EXCEL_POLL_INTERVAL_MS = 1500;
export const EXCEL_POLL_MAX_ATTEMPTS = 180;
