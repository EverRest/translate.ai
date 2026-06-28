export type ExportFormat =
  | 'json'
  | 'yaml'
  | 'csv'
  | 'android-xml'
  | 'ios-strings'
  | 'po';

export interface ExportRow {
  key: string;
  language: string;
  value: string;
}

export class ExportProjectQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly format: ExportFormat,
    public readonly language?: string,
    public readonly status?: string,
  ) {}
}

export class RequestExportCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly format: ExportFormat,
    public readonly language: string | undefined,
    public readonly status: string | undefined,
  ) {}
}

export class GetExportJobQuery {
  constructor(
    public readonly tenantId: string,
    public readonly exportJobId: string,
  ) {}
}

export class DownloadExportJobQuery {
  constructor(
    public readonly tenantId: string,
    public readonly exportJobId: string,
  ) {}
}

export type ExportJobDto = {
  id: string;
  projectId: string;
  format: ExportFormat;
  language?: string;
  statusFilter: string;
  exportStatus: string;
  rowCount: number;
  filename?: string;
  contentType?: string;
  errorMessage?: string;
  async: boolean;
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
};

export type ExportDownloadResult = {
  content: string;
  contentType: string;
  filename: string;
};

export const VALID_EXPORT_FORMATS: ExportFormat[] = [
  'json',
  'yaml',
  'csv',
  'android-xml',
  'ios-strings',
  'po',
];
