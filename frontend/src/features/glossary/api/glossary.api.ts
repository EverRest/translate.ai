import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  type ApiSuccess,
} from '../../../shared/api/client';
import type { PaginatedData } from '../../../shared/api/types';
import type {
  CreateGlossaryTermInput,
  GlossaryTerm,
  UpdateGlossaryTermInput,
} from '../types';

export async function listGlossaryTerms(
  projectId: string,
  page = 1,
  limit = 50,
  search?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) {
    params.set('search', search);
  }

  const response = await apiGet<ApiSuccess<PaginatedData<GlossaryTerm>>>(
    `/projects/${projectId}/glossary/terms?${params.toString()}`,
  );
  return response.data;
}

export async function createGlossaryTerm(
  projectId: string,
  input: CreateGlossaryTermInput,
) {
  const response = await apiPost<
    ApiSuccess<GlossaryTerm>,
    CreateGlossaryTermInput
  >(`/projects/${projectId}/glossary/terms`, input);
  return response.data;
}

export async function updateGlossaryTerm(
  projectId: string,
  termId: string,
  input: UpdateGlossaryTermInput,
) {
  const response = await apiPatch<
    ApiSuccess<GlossaryTerm>,
    UpdateGlossaryTermInput
  >(`/projects/${projectId}/glossary/terms/${termId}`, input);
  return response.data;
}

export async function deleteGlossaryTerm(projectId: string, termId: string) {
  const response = await apiDelete<ApiSuccess<{ deleted: boolean }>>(
    `/projects/${projectId}/glossary/terms/${termId}`,
  );
  return response.data;
}
