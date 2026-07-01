export type ImportSessionStatus =
  | 'pending'
  | 'parsing'
  | 'preview_ready'
  | 'applying'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ImportItemAction =
  | 'create'
  | 'update'
  | 'unchanged'
  | 'conflict'
  | 'invalid'
  | 'skip';

export type ImportDiffSummary = {
  create: number;
  update: number;
  unchanged: number;
  conflict: number;
  invalid: number;
  skip: number;
};

export type ImportSession = {
  id: string;
  projectId: string;
  sourceType: string;
  status: ImportSessionStatus;
  stats: Record<string, unknown> | null;
  warnings: Array<{ code: string; message: string }> | null;
  diffSummary: ImportDiffSummary | null;
  originalFilename: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type ImportPreviewItem = {
  id: string;
  scope: string | null;
  key: string;
  sourceText: string;
  hints: string | null;
  action: ImportItemAction;
  error: string | null;
  warning: string | null;
  before: { sourceText: string; context: string | null } | null;
  after: { sourceText: string; context: string | null } | null;
};

export type ImportPreviewResponse = {
  session: ImportSession;
  items: ImportPreviewItem[];
  meta: { total: number; page: number; limit: number };
};

export type CreateImportSessionResponse = ImportSession & {
  queued?: boolean;
};

export type ApplyImportResponse = {
  queued: boolean;
  sessionId?: string;
  session?: ImportSession;
};

export const IMPORT_POLL_INTERVAL_MS = 1500;
export const IMPORT_POLL_MAX_ATTEMPTS = 120;

export const IMPORT_ACTION_LABELS: Record<ImportItemAction, string> = {
  create: 'Create',
  update: 'Update',
  unchanged: 'Unchanged',
  conflict: 'Conflict',
  invalid: 'Invalid',
  skip: 'Skip',
};
