export type ExportFormat =
  | 'json'
  | 'yaml'
  | 'csv'
  | 'android-xml'
  | 'ios-strings'
  | 'po';

export type TranslationExportStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'published';

export type ExportProjectOptions = {
  format: ExportFormat;
  language?: string;
  status: TranslationExportStatus;
};

export const EXPORT_FORMAT_OPTIONS: Array<{
  value: ExportFormat;
  label: string;
}> = [
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'csv', label: 'CSV' },
  { value: 'po', label: 'Gettext PO' },
  { value: 'android-xml', label: 'Android XML' },
  { value: 'ios-strings', label: 'iOS Strings' },
];

export const EXPORT_STATUS_OPTIONS: Array<{
  value: TranslationExportStatus;
  label: string;
}> = [
  { value: 'published', label: 'Published' },
  { value: 'approved', label: 'Approved' },
  { value: 'review', label: 'In review' },
  { value: 'draft', label: 'Draft' },
];
