import { apiDownload } from '../../../shared/api/client';
import { buildQueryString } from '../../../shared/api/download.utils';
import type { ExportProjectOptions } from '../types';

export async function downloadProjectExport(
  projectId: string,
  options: ExportProjectOptions,
) {
  const query = buildQueryString({
    format: options.format,
    language: options.language,
    status: options.status,
  });

  return apiDownload(
    `/projects/${projectId}/export${query}`,
    `translations.${options.format === 'android-xml' ? 'xml' : options.format === 'ios-strings' ? 'strings' : options.format}`,
  );
}
