import { apiGet, apiPost, type ApiSuccess } from '../../../shared/api/client';
import type { GlossaryTerm, TerminologyDriftIssue } from '../types';

export async function scanTerminologyDrift(projectId: string) {
  const response = await apiPost<ApiSuccess<{ queued: boolean }>>(
    `/projects/${projectId}/terminology/scan`,
  );
  return response.data;
}

export async function listTerminologyDriftIssues(
  projectId: string,
  status: 'open' | 'resolved' | 'all' = 'open',
) {
  const params = new URLSearchParams({ status });
  const response = await apiGet<ApiSuccess<{ items: TerminologyDriftIssue[] }>>(
    `/projects/${projectId}/terminology/issues?${params.toString()}`,
  );
  return response.data.items;
}

export async function countTerminologyDriftIssues(projectId: string) {
  const response = await apiGet<ApiSuccess<{ count: number }>>(
    `/projects/${projectId}/terminology/issues/count`,
  );
  return response.data.count;
}

export async function getTerminologyDriftKeyHints(projectId: string) {
  const response = await apiGet<ApiSuccess<{ keys: string[] }>>(
    `/projects/${projectId}/terminology/key-hints`,
  );
  return response.data.keys;
}

export async function resolveTerminologyDriftIssue(
  projectId: string,
  issueId: string,
  canonicalTranslation: string,
) {
  const response = await apiPost<
    ApiSuccess<{ issue: TerminologyDriftIssue; term: GlossaryTerm }>,
    { canonicalTranslation: string }
  >(`/projects/${projectId}/terminology/issues/${issueId}/resolve`, {
    canonicalTranslation,
  });
  return response.data;
}
