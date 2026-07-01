import { apiGet, type ApiSuccess } from '../../../shared/api/client';

export type StaleTranslationSummary = {
  totalStaleKeys: number;
  totalStaleTranslations: number;
  byLanguage: Record<string, number>;
};

export async function getStaleTranslationSummary(projectId: string) {
  const response = await apiGet<ApiSuccess<StaleTranslationSummary>>(
    `/projects/${projectId}/translations/stale-summary`,
  );
  return response.data;
}

export async function getStaleTranslationKeyHints(projectId: string) {
  const response = await apiGet<ApiSuccess<{ keyIds: string[] }>>(
    `/projects/${projectId}/translations/stale-key-hints`,
  );
  return response.data.keyIds;
}
