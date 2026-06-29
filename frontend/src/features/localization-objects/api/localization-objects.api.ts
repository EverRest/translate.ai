import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  type ApiSuccess,
} from '../../../shared/api/client';
import type { PaginatedData } from '../../../shared/api/types';
import type {
  CreateLocalizationNodeInput,
  CreateLocalizationObjectInput,
  LocalizationObjectDetail,
  LocalizationObjectSummary,
  LocalizationNode,
  MaterializeResult,
  ObjectTemplateSummary,
  UpdateLocalizationNodeInput,
} from '../types';

export async function listLocalizationObjects(
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

  const response = await apiGet<
    ApiSuccess<PaginatedData<LocalizationObjectSummary>>
  >(`/projects/${projectId}/objects?${params.toString()}`);
  return response.data;
}

export async function getLocalizationObject(
  projectId: string,
  objectId: string,
) {
  const response = await apiGet<ApiSuccess<LocalizationObjectDetail>>(
    `/projects/${projectId}/objects/${objectId}`,
  );
  return response.data;
}

export async function createLocalizationObject(
  projectId: string,
  input: CreateLocalizationObjectInput,
) {
  const response = await apiPost<
    ApiSuccess<LocalizationObjectSummary>,
    CreateLocalizationObjectInput
  >(`/projects/${projectId}/objects`, input);
  return response.data;
}

export async function deleteLocalizationObject(
  projectId: string,
  objectId: string,
) {
  const response = await apiDelete<ApiSuccess<{ deleted: boolean }>>(
    `/projects/${projectId}/objects/${objectId}`,
  );
  return response.data;
}

export async function createLocalizationNode(
  projectId: string,
  objectId: string,
  input: CreateLocalizationNodeInput,
) {
  const response = await apiPost<
    ApiSuccess<LocalizationNode>,
    CreateLocalizationNodeInput
  >(`/projects/${projectId}/objects/${objectId}/nodes`, input);
  return response.data;
}

export async function updateLocalizationNode(
  projectId: string,
  objectId: string,
  nodeId: string,
  input: UpdateLocalizationNodeInput,
) {
  const response = await apiPatch<
    ApiSuccess<LocalizationNode>,
    UpdateLocalizationNodeInput
  >(`/projects/${projectId}/objects/${objectId}/nodes/${nodeId}`, input);
  return response.data;
}

export async function deleteLocalizationNode(
  projectId: string,
  objectId: string,
  nodeId: string,
) {
  const response = await apiDelete<ApiSuccess<{ deleted: boolean }>>(
    `/projects/${projectId}/objects/${objectId}/nodes/${nodeId}`,
  );
  return response.data;
}

export async function materializeLocalizationObject(
  projectId: string,
  objectId: string,
) {
  const response = await apiPost<ApiSuccess<MaterializeResult>>(
    `/projects/${projectId}/objects/${objectId}/materialize`,
  );
  return response.data;
}

export async function translateLocalizationObject(
  projectId: string,
  objectId: string,
  languages: string[],
) {
  const response = await apiPost<
    ApiSuccess<{ jobId: string; status: string }>,
    { languages: string[] }
  >(`/projects/${projectId}/objects/${objectId}/translate`, { languages });
  return response.data;
}

export async function listObjectTemplates(projectId: string) {
  const response = await apiGet<ApiSuccess<{ items: ObjectTemplateSummary[] }>>(
    `/projects/${projectId}/objects/templates`,
  );
  return response.data.items;
}

export async function generateObjectStructure(
  projectId: string,
  objectId: string,
) {
  const response = await apiPost<
    ApiSuccess<{ queued: boolean; generationStatus: string }>
  >(`/projects/${projectId}/objects/${objectId}/generate-structure`);
  return response.data;
}

export async function applyObjectTemplate(
  projectId: string,
  objectId: string,
  templateId: string,
) {
  const response = await apiPost<
    ApiSuccess<{ applied: boolean; templateId: string; templateName: string }>,
    { templateId: string }
  >(`/projects/${projectId}/objects/${objectId}/apply-template`, {
    templateId,
  });
  return response.data;
}
