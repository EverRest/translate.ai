import {
  apiGet,
  apiPost,
  apiPut,
  type ApiSuccess,
} from '../../../shared/api/client';
import { useAuthStore } from '../../auth/store/auth.store';
import type {
  ExcelImportProfile,
  ExcelImportSession,
} from '../types/excel.types';

const baseUrl = import.meta.env.VITE_API_URL ?? '/api/v1';

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function previewExcelImport(
  projectId: string,
  file: File,
  parseRulesJson?: string,
): Promise<ExcelImportSession> {
  const formData = new FormData();
  formData.append('file', file);
  if (parseRulesJson) {
    formData.append('parseRulesJson', parseRulesJson);
  }

  const response = await fetch(
    `${baseUrl}/projects/${projectId}/import/excel/preview`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    },
  );

  const body = (await response.json()) as ApiSuccess<ExcelImportSession> & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(body.message ?? 'Excel preview failed');
  }

  return body.data;
}

export async function getExcelImportSession(
  projectId: string,
  sessionId: string,
): Promise<ExcelImportSession> {
  const response = await apiGet<ApiSuccess<ExcelImportSession>>(
    `/projects/${projectId}/import/excel/${sessionId}`,
  );
  return response.data;
}

export async function deltaTranslateExcel(
  projectId: string,
  sessionId: string,
  languages?: string[],
): Promise<{ sessionId: string; jobId: string; itemCount: number }> {
  const response = await apiPost<
    ApiSuccess<{ sessionId: string; jobId: string; itemCount: number }>,
    { languages?: string[] }
  >(`/projects/${projectId}/import/excel/${sessionId}/delta-translate`, {
    languages,
  });
  return response.data;
}

export async function getExcelImportProfile(
  projectId: string,
): Promise<ExcelImportProfile> {
  const response = await apiGet<ApiSuccess<ExcelImportProfile>>(
    `/projects/${projectId}/import/excel/profile`,
  );
  return response.data;
}

export async function saveExcelImportProfile(
  projectId: string,
  profile: ExcelImportProfile,
): Promise<ExcelImportProfile> {
  const response = await apiPut<
    ApiSuccess<ExcelImportProfile>,
    ExcelImportProfile
  >(`/projects/${projectId}/import/excel/profile`, profile);
  return response.data;
}

export function excelDownloadUrl(projectId: string, sessionId: string): string {
  return `${baseUrl}/projects/${projectId}/import/excel/${sessionId}/download`;
}

export async function downloadExcelImport(
  projectId: string,
  sessionId: string,
): Promise<Blob> {
  const response = await fetch(excelDownloadUrl(projectId, sessionId), {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message ?? 'Download failed');
  }

  return response.blob();
}
