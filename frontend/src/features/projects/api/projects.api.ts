import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  type ApiSuccess,
} from '../../../shared/api/client';
import type { PaginatedData } from '../../../shared/api/types';
import type { CreateProjectInput, Project, UpdateProjectInput } from '../types';

export async function listProjects(page = 1, limit = 20) {
  const response = await apiGet<ApiSuccess<PaginatedData<Project>>>(
    `/projects?page=${page}&limit=${limit}`,
  );
  return response.data;
}

export async function getProject(projectId: string) {
  const response = await apiGet<ApiSuccess<Project>>(`/projects/${projectId}`);
  return response.data;
}

export async function createProject(input: CreateProjectInput) {
  const response = await apiPost<ApiSuccess<Project>, CreateProjectInput>(
    '/projects',
    input,
  );
  return response.data;
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
) {
  const response = await apiPatch<ApiSuccess<Project>, UpdateProjectInput>(
    `/projects/${projectId}`,
    input,
  );
  return response.data;
}

export async function archiveProject(projectId: string) {
  const response = await apiDelete<ApiSuccess<Project>>(
    `/projects/${projectId}`,
  );
  return response.data;
}
