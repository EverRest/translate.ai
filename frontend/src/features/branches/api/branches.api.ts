import {
  apiGet,
  apiPatch,
  apiPost,
  type ApiSuccess,
} from '../../../shared/api/client';
import type {
  BranchDiffItem,
  MergeBranchResult,
  ProjectBranch,
  UpdateBranchTranslationInput,
} from '../types';

export async function listBranches(projectId: string) {
  const response = await apiGet<ApiSuccess<{ items: ProjectBranch[] }>>(
    `/projects/${projectId}/branches`,
  );
  return response.data.items;
}

export async function createBranch(projectId: string, name: string) {
  const response = await apiPost<ApiSuccess<ProjectBranch>, { name: string }>(
    `/projects/${projectId}/branches`,
    { name },
  );
  return response.data;
}

export async function getBranchDiff(projectId: string, branchId: string) {
  const response = await apiGet<ApiSuccess<{ items: BranchDiffItem[] }>>(
    `/projects/${projectId}/branches/${branchId}/diff`,
  );
  return response.data.items;
}

export async function mergeBranch(projectId: string, branchId: string) {
  const response = await apiPost<ApiSuccess<MergeBranchResult>>(
    `/projects/${projectId}/branches/${branchId}/merge`,
  );
  return response.data;
}

export async function updateBranchTranslation(
  projectId: string,
  branchId: string,
  input: UpdateBranchTranslationInput,
) {
  const response = await apiPatch<
    ApiSuccess<{
      translationKeyId: string;
      key: string;
      language: string;
      value: string;
    }>,
    UpdateBranchTranslationInput
  >(`/projects/${projectId}/branches/${branchId}/translations`, input);
  return response.data;
}
