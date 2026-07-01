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
  ConfluencePendingSite,
  ConfluenceSpace,
  ParseRulesJson,
} from '../types/confluence';

export type UpdateConfluenceConfigInput = {
  pageIds: string[];
  spaceKey?: string;
  autoApply?: boolean;
  labelFilter?: string | null;
  parseRulesJson?: ParseRulesJson | null;
  syncEnabled?: boolean;
  syncIntervalMinutes?: number | null;
};

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

export async function getConfluencePendingSites(
  projectId: string,
  pendingToken: string,
): Promise<ConfluencePendingSite[]> {
  const response = await apiGet<ApiSuccess<{ sites: ConfluencePendingSite[] }>>(
    `/projects/${projectId}/integrations/confluence/connect/pending-sites?pendingToken=${encodeURIComponent(pendingToken)}`,
  );
  return response.data.sites;
}

export async function completeConfluenceConnect(
  projectId: string,
  pendingToken: string,
  cloudId: string,
): Promise<{ projectId: string; siteName: string }> {
  const response = await apiPost<
    ApiSuccess<{ projectId: string; siteName: string }>
  >(`/projects/${projectId}/integrations/confluence/connect/complete`, {
    pendingToken,
    cloudId,
  });
  return response.data;
}

export async function updateConfluenceConfig(
  projectId: string,
  input: UpdateConfluenceConfigInput,
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
  label?: string,
): Promise<ConfluencePage[]> {
  const query = label ? `?label=${encodeURIComponent(label)}` : '';
  const response = await apiGet<ApiSuccess<{ items: ConfluencePage[] }>>(
    `/projects/${projectId}/integrations/confluence/spaces/${spaceId}/pages${query}`,
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
