import { apiDelete, apiGet, type ApiSuccess } from '../../../shared/api/client';
import type { PaginatedData } from '../../../shared/api/types';
import type { Translation } from '../types';

export async function deleteAllTranslations(projectId: string) {
  const response = await apiDelete<ApiSuccess<{ deleted: number }>>(
    `/projects/${projectId}/translations`,
  );
  return response.data;
}

export async function listTranslations(
  projectId: string,
  page = 1,
  limit = 500,
  language?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (language) params.set('language', language);

  const response = await apiGet<ApiSuccess<PaginatedData<Translation>>>(
    `/projects/${projectId}/translations?${params.toString()}`,
  );
  return response.data;
}
