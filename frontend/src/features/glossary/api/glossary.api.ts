import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  type ApiSuccess,
} from '../../../shared/api/client';
import type { PaginatedData } from '../../../shared/api/types';
import type {
  AnalyzeGlossaryResult,
  CreateGlossaryTermInput,
  GlossarySet,
  GlossarySuggestion,
  GlossaryTerm,
  UpdateGlossaryTermInput,
} from '../types';

export async function listGlossaries(projectId: string) {
  const response = await apiGet<ApiSuccess<{ items: GlossarySet[] }>>(
    `/projects/${projectId}/glossaries`,
  );
  return response.data.items;
}

export async function createGlossarySet(
  projectId: string,
  input: { name: string; cloneFromActive?: boolean },
) {
  const response = await apiPost<
    ApiSuccess<GlossarySet>,
    { name: string; cloneFromActive?: boolean }
  >(`/projects/${projectId}/glossaries`, input);
  return response.data;
}

export async function activateGlossarySet(
  projectId: string,
  glossaryId: string,
) {
  const response = await apiPost<
    ApiSuccess<{ activated: boolean; glossaryId: string }>
  >(`/projects/${projectId}/glossaries/${glossaryId}/activate`);
  return response.data;
}

export async function listGlossaryTerms(
  projectId: string,
  page = 1,
  limit = 50,
  search?: string,
  glossaryId?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) {
    params.set('search', search);
  }
  if (glossaryId) {
    params.set('glossaryId', glossaryId);
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

export async function upsertGlossaryTerm(
  projectId: string,
  input: CreateGlossaryTermInput,
) {
  const response = await apiPut<
    ApiSuccess<{ term: GlossaryTerm; created: boolean }>,
    CreateGlossaryTermInput
  >(`/projects/${projectId}/glossary/terms/upsert`, input);
  return response.data;
}

export async function bulkUpsertGlossaryTerms(
  projectId: string,
  terms: CreateGlossaryTermInput[],
) {
  const response = await apiPost<
    ApiSuccess<{ created: number; updated: number; total: number }>,
    { terms: CreateGlossaryTermInput[] }
  >(`/projects/${projectId}/glossary/terms/bulk-upsert`, { terms });
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

export async function listGlossarySuggestions(
  projectId: string,
  status: GlossarySuggestion['status'] = 'pending',
) {
  const params = new URLSearchParams({ status });
  const response = await apiGet<ApiSuccess<{ items: GlossarySuggestion[] }>>(
    `/projects/${projectId}/glossary/suggestions?${params.toString()}`,
  );
  return response.data.items;
}

export async function analyzeGlossary(projectId: string) {
  const response = await apiPost<ApiSuccess<AnalyzeGlossaryResult>>(
    `/projects/${projectId}/glossary/suggestions/analyze`,
  );
  return response.data;
}

export async function approveGlossarySuggestion(
  projectId: string,
  suggestionId: string,
) {
  const response = await apiPost<
    ApiSuccess<{ suggestion: GlossarySuggestion; term: GlossaryTerm }>
  >(`/projects/${projectId}/glossary/suggestions/${suggestionId}/approve`);
  return response.data;
}

export async function rejectGlossarySuggestion(
  projectId: string,
  suggestionId: string,
) {
  const response = await apiPost<ApiSuccess<{ rejected: boolean }>>(
    `/projects/${projectId}/glossary/suggestions/${suggestionId}/reject`,
  );
  return response.data;
}
