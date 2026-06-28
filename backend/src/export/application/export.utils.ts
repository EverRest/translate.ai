import { BadRequestException } from '@nestjs/common';
import { TranslationStatus } from '@prisma/client';
import {
  ExportFormat,
  ExportJobDto,
  VALID_EXPORT_FORMATS,
} from './export.commands';

const VALID_STATUSES = Object.values(TranslationStatus);

export function parseExportStatus(
  status: string | undefined,
): TranslationStatus {
  const resolved = status ?? TranslationStatus.published;
  if (!VALID_STATUSES.includes(resolved as TranslationStatus)) {
    throw new BadRequestException(`Invalid status: ${status}`);
  }
  return resolved as TranslationStatus;
}

export function assertExportFormat(format: string): ExportFormat {
  if (!VALID_EXPORT_FORMATS.includes(format as ExportFormat)) {
    throw new BadRequestException(`Unsupported format: ${format}`);
  }
  return format as ExportFormat;
}

export function toExportJobDto(
  job: {
    id: string;
    projectId: string;
    format: string;
    language: string | null;
    statusFilter: TranslationStatus;
    exportStatus: string;
    rowCount: number;
    filename: string | null;
    contentType: string | null;
    errorMessage: string | null;
    createdAt: Date;
    completedAt: Date | null;
  },
  async: boolean,
): ExportJobDto {
  const downloadUrl =
    job.exportStatus === 'completed'
      ? `/exports/${job.id}/download`
      : undefined;

  return {
    id: job.id,
    projectId: job.projectId,
    format: job.format as ExportFormat,
    language: job.language ?? undefined,
    statusFilter: job.statusFilter,
    exportStatus: job.exportStatus,
    rowCount: job.rowCount,
    filename: job.filename ?? undefined,
    contentType: job.contentType ?? undefined,
    errorMessage: job.errorMessage ?? undefined,
    async,
    downloadUrl,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString(),
  };
}
