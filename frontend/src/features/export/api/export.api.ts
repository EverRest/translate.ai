import {
  apiDownload,
  apiGet,
  apiPost,
  type ApiSuccess,
} from '../../../shared/api/client';
import type { ExportJob, ExportProjectOptions } from '../types';

export async function requestProjectExport(
  projectId: string,
  options: ExportProjectOptions,
): Promise<ExportJob> {
  const response = await apiPost<ApiSuccess<ExportJob>, ExportProjectOptions>(
    `/projects/${projectId}/exports`,
    options,
  );
  return response.data;
}

export async function getExportJob(exportJobId: string): Promise<ExportJob> {
  const response = await apiGet<ApiSuccess<ExportJob>>(
    `/exports/${exportJobId}`,
  );
  return response.data;
}

export async function downloadExportJob(exportJobId: string) {
  return apiDownload(`/exports/${exportJobId}/download`, 'translations.export');
}

export async function downloadProjectExportSync(
  projectId: string,
  options: ExportProjectOptions,
) {
  const query = new URLSearchParams({
    format: options.format,
    status: options.status,
  });
  if (options.language) {
    query.set('language', options.language);
  }

  return apiDownload(
    `/projects/${projectId}/export?${query.toString()}`,
    `translations.${options.format === 'android-xml' ? 'xml' : options.format === 'ios-strings' ? 'strings' : options.format}`,
  );
}
