export type ExportFormat =
  'json' | 'yaml' | 'csv' | 'android-xml' | 'ios-strings' | 'po';

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
