import { apiGet, apiPost, type ApiSuccess } from '../../../shared/api/client';
import { useAuthStore } from '../../auth/store/auth.store';
import type {
  ApplyImportResponse,
  CreateImportSessionResponse,
  ImportPreviewResponse,
  ImportSession,
} from '../types';

const baseUrl = import.meta.env.VITE_API_URL ?? '/api/v1';

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function uploadImportFile(
  projectId: string,
  file: File,
  parseRulesJson?: string,
): Promise<CreateImportSessionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (parseRulesJson) {
    formData.append('parseRulesJson', parseRulesJson);
  }

  const response = await fetch(
    `${baseUrl}/projects/${projectId}/import/sessions`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    },
  );

  const body =
    (await response.json()) as ApiSuccess<CreateImportSessionResponse> & {
      message?: string;
    };

  if (!response.ok) {
    throw new Error(body.message ?? 'Import upload failed');
  }

  return body.data;
}

export async function pasteImportHtml(
  projectId: string,
  html: string,
  parseRules?: { columnMapping?: Record<string, string | undefined> },
): Promise<CreateImportSessionResponse> {
  const response = await apiPost<
    ApiSuccess<CreateImportSessionResponse>,
    {
      html: string;
      parseRules?: { columnMapping?: Record<string, string | undefined> };
    }
  >(`/projects/${projectId}/import/sessions/paste`, { html, parseRules });
  return response.data;
}

export async function getImportSession(
  projectId: string,
  sessionId: string,
): Promise<ImportSession> {
  const response = await apiGet<ApiSuccess<ImportSession>>(
    `/projects/${projectId}/import/sessions/${sessionId}`,
  );
  return response.data;
}

export async function previewImportSession(
  projectId: string,
  sessionId: string,
  page = 1,
  limit = 50,
  action?: string,
): Promise<ImportPreviewResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (action) {
    query.set('action', action);
  }

  const response = await apiGet<ApiSuccess<ImportPreviewResponse>>(
    `/projects/${projectId}/import/sessions/${sessionId}/preview?${query.toString()}`,
  );
  return response.data;
}

export async function applyImportSession(
  projectId: string,
  sessionId: string,
  conflictStrategy: 'skip' | 'update' = 'update',
): Promise<ApplyImportResponse> {
  const response = await apiPost<
    ApiSuccess<ApplyImportResponse>,
    { conflictStrategy: 'skip' | 'update' }
  >(`/projects/${projectId}/import/sessions/${sessionId}/apply`, {
    conflictStrategy,
  });
  return response.data;
}
