import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  type ApiSuccess,
} from '../../../shared/api/client';
import type { PaginatedData } from '../../../shared/api/types';
import type {
  CreateTranslationKeyInput,
  TranslationKey,
  UpdateTranslationKeyInput,
} from '../types';

export async function listTranslationKeys(
  projectId: string,
  page = 1,
  limit = 20,
  search?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search?.trim()) {
    params.set('search', search.trim());
  }

  const response = await apiGet<ApiSuccess<PaginatedData<TranslationKey>>>(
    `/projects/${projectId}/keys?${params.toString()}`,
  );
  return response.data;
}

export async function createTranslationKey(
  projectId: string,
  input: CreateTranslationKeyInput,
) {
  const response = await apiPost<
    ApiSuccess<TranslationKey>,
    CreateTranslationKeyInput
  >(`/projects/${projectId}/keys`, input);
  return response.data;
}

export async function updateTranslationKey(
  projectId: string,
  keyId: string,
  input: UpdateTranslationKeyInput,
) {
  const response = await apiPatch<
    ApiSuccess<TranslationKey>,
    UpdateTranslationKeyInput
  >(`/projects/${projectId}/keys/${keyId}`, input);
  return response.data;
}

export async function deleteTranslationKey(projectId: string, keyId: string) {
  const response = await apiDelete<ApiSuccess<{ deleted: boolean }>>(
    `/projects/${projectId}/keys/${keyId}`,
  );
  return response.data;
}

export async function deleteAllTranslationKeys(projectId: string) {
  const response = await apiDelete<ApiSuccess<{ deleted: number }>>(
    `/projects/${projectId}/keys`,
  );
  return response.data;
}

export async function bulkImportKeys(
  projectId: string,
  keys: Array<{ key: string; sourceText: string }>,
) {
  const response = await apiPost<
    ApiSuccess<{ created: number; total: number }>,
    { keys: Array<{ key: string; sourceText: string }> }
  >(`/projects/${projectId}/keys/bulk-import`, { keys });
  return response.data;
}
