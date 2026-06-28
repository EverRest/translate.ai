import { IsIn, IsOptional, IsString } from 'class-validator';
import type { ExportFormat } from '../application/export.commands';

const EXPORT_FORMATS: ExportFormat[] = [
  'json',
  'yaml',
  'csv',
  'android-xml',
  'ios-strings',
  'po',
];

const EXPORT_STATUSES = ['draft', 'review', 'approved', 'published'] as const;

export class RequestExportDto {
  @IsIn(EXPORT_FORMATS)
  format!: ExportFormat;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsIn(EXPORT_STATUSES)
  status?: (typeof EXPORT_STATUSES)[number];
}
