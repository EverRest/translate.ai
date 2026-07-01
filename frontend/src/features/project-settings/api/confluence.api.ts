import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  type ApiSuccess,
} from '../../../shared/api/client';
import type {
  ConfluenceIntegration,
  ConfluencePage,
  ConfluenceSpace,
} from '../types/confluence';

export async function getConfluenceIntegration(
  projectId: string,
): Promise<ConfluenceIntegration> {
  const response = await apiGet<ApiSuccess<ConfluenceIntegration>>(
    `/projects/${projectId}/integrations/confluence`,
  );
  return response.data;
}

export async function getConfluenceConnectUrl(
  projectId: string,
): Promise<string> {
  const response = await apiGet<ApiSuccess<{ url: string }>>(
    `/projects/${projectId}/integrations/confluence/connect`,
  );
  return response.data.url;
}

export async function updateConfluenceConfig(
  projectId: string,
  input: { pageIds: string[]; spaceKey?: string; autoApply?: boolean },
): Promise<void> {
  await apiPut(`/projects/${projectId}/integrations/confluence/config`, input);
}

export async function listConfluenceSpaces(
  projectId: string,
): Promise<ConfluenceSpace[]> {
  const response = await apiGet<ApiSuccess<{ items: ConfluenceSpace[] }>>(
    `/projects/${projectId}/integrations/confluence/spaces`,
  );
  return response.data.items;
}

export async function listConfluencePages(
  projectId: string,
  spaceId: string,
): Promise<ConfluencePage[]> {
  const response = await apiGet<ApiSuccess<{ items: ConfluencePage[] }>>(
    `/projects/${projectId}/integrations/confluence/spaces/${spaceId}/pages`,
  );
  return response.data.items;
}

export async function triggerConfluenceSync(
  projectId: string,
  autoApply?: boolean,
): Promise<{ sessionId: string; queued: boolean; autoApply: boolean }> {
  const response = await apiPost<
    ApiSuccess<{ sessionId: string; queued: boolean; autoApply: boolean }>
  >(`/projects/${projectId}/integrations/confluence/sync`, {
    autoApply,
  });
  return response.data;
}

export async function disconnectConfluence(projectId: string): Promise<void> {
  await apiDelete(`/projects/${projectId}/integrations/confluence`);
}
