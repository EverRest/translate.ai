import { useAuthStore } from '../../auth/store/auth.store';
import { apiDelete, apiGet, apiPost } from '../../../shared/api/client';
import { ApiError, type ApiSuccess } from '../../../shared/api/types';
import type {
  CreateKnowledgeSourceInput,
  CreateKnowledgeSourceResult,
  KnowledgeSource,
} from '../types';

export async function listKnowledgeSources(projectId: string) {
  const response = await apiGet<ApiSuccess<{ items: KnowledgeSource[] }>>(
    `/projects/${projectId}/knowledge/sources`,
  );
  return response.data.items;
}

export async function createKnowledgeSource(
  projectId: string,
  input: CreateKnowledgeSourceInput,
) {
  const response = await apiPost<ApiSuccess<CreateKnowledgeSourceResult>>(
    `/projects/${projectId}/knowledge/sources`,
    input,
  );
  return response.data;
}

export async function uploadKnowledgeFile(
  projectId: string,
  file: File,
  name?: string,
) {
  const formData = new FormData();
  formData.append('file', file);
  if (name?.trim()) {
    formData.append('name', name.trim());
  }

  const token = useAuthStore.getState().accessToken;
  const baseUrl = import.meta.env.VITE_API_URL ?? '/api/v1';
  const response = await fetch(
    `${baseUrl}/projects/${projectId}/knowledge/sources/upload`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    },
  );

  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string | { message?: string };
    data?: CreateKnowledgeSourceResult;
  };

  if (!response.ok) {
    const message =
      typeof body.error === 'string'
        ? body.error
        : (body.error?.message ??
          body.message ??
          `API error: ${response.status}`);
    throw new ApiError(message, response.status);
  }

  return body.data as CreateKnowledgeSourceResult;
}

export async function deleteKnowledgeSource(
  projectId: string,
  sourceId: string,
) {
  const response = await apiDelete<ApiSuccess<{ deleted: boolean }>>(
    `/projects/${projectId}/knowledge/sources/${sourceId}`,
  );
  return response.data;
}
