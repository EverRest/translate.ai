import { apiDelete, apiGet, apiPost } from '../../../shared/api/client';
import type {
  EntityCollectionSummary,
  OpenApiImportResult,
  OpenApiPreviewResult,
} from '../types';

export async function listEntityCollections(
  projectId: string,
): Promise<EntityCollectionSummary[]> {
  const response = await apiGet<{
    success: boolean;
    data: { items: EntityCollectionSummary[] };
  }>(`/projects/${projectId}/collections`);
  return response.data.items;
}

export async function createEntityCollection(
  projectId: string,
  input: { name: string; slug: string; description?: string },
): Promise<EntityCollectionSummary> {
  const response = await apiPost<{
    success: boolean;
    data: EntityCollectionSummary;
  }>(`/projects/${projectId}/collections`, input);
  return response.data;
}

export async function deleteEntityCollection(
  projectId: string,
  collectionId: string,
): Promise<void> {
  await apiDelete(`/projects/${projectId}/collections/${collectionId}`);
}

export async function previewOpenApiImport(
  projectId: string,
  collectionId: string,
  input: { spec: string; selectedTags?: string[] },
): Promise<OpenApiPreviewResult> {
  const response = await apiPost<{
    success: boolean;
    data: OpenApiPreviewResult;
  }>(
    `/projects/${projectId}/collections/${collectionId}/import/openapi/preview`,
    input,
  );
  return response.data;
}

export async function importOpenApi(
  projectId: string,
  collectionId: string,
  input: {
    spec: string;
    selectedTags?: string[];
    materialize?: boolean;
  },
): Promise<OpenApiImportResult> {
  const response = await apiPost<{
    success: boolean;
    data: OpenApiImportResult;
  }>(
    `/projects/${projectId}/collections/${collectionId}/import/openapi`,
    input,
  );
  return response.data;
}
