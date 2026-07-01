import { apiGet, apiPost, type ApiSuccess } from '../../../shared/api/client';
import type { DomainPreset } from '../../projects/types';

export async function listDomainPresets(projectId: string) {
  const response = await apiGet<ApiSuccess<{ items: DomainPreset[] }>>(
    `/projects/${projectId}/domain-presets`,
  );
  return response.data.items;
}

export async function applyGlossaryPreset(projectId: string, presetId: string) {
  const response = await apiPost<
    ApiSuccess<{ presetId: string; added: number; skipped: number }>,
    { presetId: string }
  >(`/projects/${projectId}/glossary/presets/apply`, { presetId });
  return response.data;
}
