import { apiGet, apiPost, type ApiSuccess } from '../../../shared/api/client';
import type { PaginatedData } from '../../../shared/api/types';
import { listProjectLanguages as fetchProjectLanguages } from '../../project-settings/api/project-settings.api';
import type { CreateJobInput, JobDetail, TranslationJob } from '../types';

export async function listJobs(page = 1, limit = 20, projectId?: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (projectId) {
    params.set('projectId', projectId);
  }

  const response = await apiGet<ApiSuccess<PaginatedData<TranslationJob>>>(
    `/jobs?${params.toString()}`,
  );
  return response.data;
}

export async function getJob(jobId: string) {
  const response = await apiGet<ApiSuccess<JobDetail>>(`/jobs/${jobId}`);
  return response.data;
}

export async function createJob(input: CreateJobInput) {
  const response = await apiPost<
    ApiSuccess<{ jobId: string; status: string }>,
    CreateJobInput
  >('/jobs', input);
  return response.data;
}

export async function retryJob(jobId: string) {
  const response = await apiPost<ApiSuccess<{ jobId: string; status: string }>>(
    `/jobs/${jobId}/retry`,
  );
  return response.data;
}

export async function cancelJob(jobId: string) {
  const response = await apiPost<ApiSuccess<{ jobId: string; status: string }>>(
    `/jobs/${jobId}/cancel`,
  );
  return response.data;
}

export async function listProjectLanguages(projectId: string) {
  return fetchProjectLanguages(projectId);
}
