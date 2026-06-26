import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  type ApiSuccess,
} from '../../../shared/api/client';

export type ProjectLanguage = {
  id: string;
  projectId: string;
  code: string;
  isDefault: boolean;
};

export async function listProjectLanguages(projectId: string) {
  const response = await apiGet<ApiSuccess<{ items: ProjectLanguage[] }>>(
    `/projects/${projectId}/languages`,
  );
  return response.data.items;
}

export async function addProjectLanguage(projectId: string, code: string) {
  const response = await apiPost<ApiSuccess<ProjectLanguage>, { code: string }>(
    `/projects/${projectId}/languages`,
    { code },
  );
  return response.data;
}

export async function removeProjectLanguage(
  projectId: string,
  languageId: string,
) {
  const response = await apiDelete<ApiSuccess<{ removed: boolean }>>(
    `/projects/${projectId}/languages/${languageId}`,
  );
  return response.data;
}

export type ApiKey = {
  id: string;
  name: string;
  active: boolean;
};

export async function listApiKeys(projectId: string) {
  const response = await apiGet<ApiSuccess<{ items: ApiKey[] }>>(
    `/projects/${projectId}/api-keys`,
  );
  return response.data.items;
}

export async function createApiKey(projectId: string, name: string) {
  const response = await apiPost<
    ApiSuccess<ApiKey & { secret: string }>,
    { name: string }
  >(`/projects/${projectId}/api-keys`, { name });
  return response.data;
}

export async function revokeApiKey(projectId: string, apiKeyId: string) {
  const response = await apiDelete<ApiSuccess<{ revoked: boolean }>>(
    `/projects/${projectId}/api-keys/${apiKeyId}`,
  );
  return response.data;
}

export type Webhook = {
  id: string;
  url: string;
  enabled: boolean;
};

export async function listWebhooks(projectId: string) {
  const response = await apiGet<ApiSuccess<{ items: Webhook[] }>>(
    `/projects/${projectId}/webhooks`,
  );
  return response.data.items;
}

export async function createWebhook(
  projectId: string,
  input: { url: string; secret?: string; enabled?: boolean },
) {
  const response = await apiPost<
    ApiSuccess<Webhook & { secret: string }>,
    typeof input
  >(`/projects/${projectId}/webhooks`, input);
  return response.data;
}

export async function updateWebhook(
  projectId: string,
  webhookId: string,
  input: { url?: string; enabled?: boolean },
) {
  const response = await apiPatch<ApiSuccess<Webhook>, typeof input>(
    `/projects/${projectId}/webhooks/${webhookId}`,
    input,
  );
  return response.data;
}

export async function deleteWebhook(projectId: string, webhookId: string) {
  const response = await apiDelete<ApiSuccess<{ deleted: boolean }>>(
    `/projects/${projectId}/webhooks/${webhookId}`,
  );
  return response.data;
}
