import { buildQueryString } from '../../../shared/api/download.utils';
import type { ExportProjectOptions } from '../types';

export function buildExportPath(
  projectId: string,
  options: ExportProjectOptions,
): string {
  const query = buildQueryString({
    format: options.format,
    language: options.language,
    status: options.status,
  });
  return `/projects/${projectId}/export${query}`;
}
