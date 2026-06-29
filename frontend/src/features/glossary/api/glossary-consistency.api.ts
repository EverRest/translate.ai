import { apiGet, apiPost, type ApiSuccess } from '../../../shared/api/client';
import type { CreateGlossaryTermInput, GlossaryPreset } from '../types';

export type TerminologyVariant = {
  value: string;
  count: number;
  keyIds: string[];
};

export type TerminologyIssue = {
  id: string;
  sourceTerm: string;
  language: string;
  status: 'open' | 'resolved' | 'dismissed';
  variants: TerminologyVariant[];
  severity: 'low' | 'medium' | 'high';
  scanId: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export async function listGlossaryPresets(projectId: string) {
  const response = await apiGet<ApiSuccess<{ items: GlossaryPreset[] }>>(
    `/projects/${projectId}/glossary/presets`,
  );
  return response.data.items;
}

export async function applyGlossaryPreset(
  projectId: string,
  presetId: string,
  mode: 'merge' | 'replace_all_in_preset' = 'merge',
) {
  const response = await apiPost<
    ApiSuccess<{
      presetId: string;
      created: number;
      updated: number;
      skipped: number;
      total: number;
    }>,
    { presetId: string; mode: 'merge' | 'replace_all_in_preset' }
  >(`/projects/${projectId}/glossary/apply-preset`, { presetId, mode });
  return response.data;
}

export async function scanTerminology(projectId: string) {
  const response = await apiPost<ApiSuccess<{ queued: boolean }>>(
    `/projects/${projectId}/terminology/scan`,
  );
  return response.data;
}

export async function listTerminologyIssues(
  projectId: string,
  status: TerminologyIssue['status'] = 'open',
) {
  const params = new URLSearchParams({ status });
  const response = await apiGet<ApiSuccess<{ items: TerminologyIssue[] }>>(
    `/projects/${projectId}/terminology/issues?${params.toString()}`,
  );
  return response.data.items;
}

export async function resolveTerminologyIssue(
  projectId: string,
  issueId: string,
  input: {
    canonicalValue: string;
    addToGlossary?: boolean;
    retranslate?: boolean;
  },
) {
  const response = await apiPost<
    ApiSuccess<{ resolved: boolean; retranslateJobId?: string }>,
    typeof input
  >(`/projects/${projectId}/terminology/issues/${issueId}/resolve`, input);
  return response.data;
}

export async function dismissTerminologyIssue(
  projectId: string,
  issueId: string,
) {
  const response = await apiPost<ApiSuccess<{ dismissed: boolean }>>(
    `/projects/${projectId}/terminology/issues/${issueId}/dismiss`,
  );
  return response.data;
}

export type { CreateGlossaryTermInput };
