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

export type ListTranslationKeysFilter = {
  localizationObjectId?: string;
  keyPrefix?: string;
  staleOnly?: boolean;
};

export async function listTranslationKeys(
  projectId: string,
  page = 1,
  limit = 20,
  search?: string,
  filter?: ListTranslationKeysFilter,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search?.trim()) {
    params.set('search', search.trim());
  }
  if (filter?.localizationObjectId) {
    params.set('localizationObjectId', filter.localizationObjectId);
  }
  if (filter?.keyPrefix) {
    params.set('keyPrefix', filter.keyPrefix);
  }
  if (filter?.staleOnly) {
    params.set('staleOnly', 'true');
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

export async function listAllTranslationKeyNames(
  projectId: string,
): Promise<string[]> {
  const PAGE_SIZE = 2000;
  const first = await listTranslationKeys(projectId, 1, PAGE_SIZE);
  const total = first.meta.total;
  const names = first.items.map((k) => k.key);
  if (total <= PAGE_SIZE) return names;

  const pages = Math.ceil(total / PAGE_SIZE);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      listTranslationKeys(projectId, i + 2, PAGE_SIZE).then((r) =>
        r.items.map((k) => k.key),
      ),
    ),
  );
  return [...names, ...rest.flat()];
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
