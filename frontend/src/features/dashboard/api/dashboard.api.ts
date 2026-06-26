import { apiGet, type ApiSuccess } from '../../../shared/api/client';
import type { PaginatedData } from '../../../shared/api/types';

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  status: string;
};

export type JobSummary = {
  id: string;
  projectId: string;
  projectName: string;
  status: string;
  provider: string | null;
  itemCount: number;
  createdAt: string;
};

export type UsageSummary = {
  totalRequests: number;
  totalCostUsd: number;
  fallbackCount: number;
  byProvider: Array<{
    provider: string;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  }>;
};

export type TrafficSummary = {
  hours: number;
  totalRequests: number;
  avgDurationMs: number;
  byRoute: Array<{ route: string; requests: number }>;
  byStatus: Array<{ status: number; requests: number }>;
  byMethod: Array<{ method: string; requests: number }>;
};

export type TrafficTimeline = {
  hours: number;
  points: Array<{ timestamp: string; requests: number }>;
};

export async function fetchProjectsTotal() {
  const response = await apiGet<ApiSuccess<PaginatedData<ProjectSummary>>>(
    '/projects?limit=1&page=1',
  );
  return response.data.meta.total;
}

export async function fetchRecentJobs(limit = 5) {
  const response = await apiGet<ApiSuccess<PaginatedData<JobSummary>>>(
    `/jobs?limit=${limit}&page=1`,
  );
  return response.data.items;
}

export async function fetchActiveJobsCount() {
  const response = await apiGet<ApiSuccess<PaginatedData<JobSummary>>>(
    '/jobs?limit=100&page=1',
  );
  return response.data.items.filter(
    (job) => job.status === 'pending' || job.status === 'processing',
  ).length;
}

export async function fetchUsageSummary() {
  const response = await apiGet<ApiSuccess<UsageSummary>>(
    '/analytics/usage/summary',
  );
  return response.data;
}

export async function fetchTrafficSummary(hours = 24) {
  const response = await apiGet<ApiSuccess<TrafficSummary>>(
    `/analytics/traffic/summary?hours=${hours}`,
  );
  return response.data;
}

export async function fetchTrafficTimeline(hours = 24) {
  const response = await apiGet<ApiSuccess<TrafficTimeline>>(
    `/analytics/traffic/timeline?hours=${hours}`,
  );
  return response.data;
}

export async function fetchPendingReviewsCount(projectIds: string[]) {
  if (projectIds.length === 0) {
    return 0;
  }

  const counts = await Promise.all(
    projectIds.map((projectId) =>
      apiGet<ApiSuccess<PaginatedData<unknown>>>(
        `/projects/${projectId}/reviews?limit=1&page=1`,
      )
        .then((response) => response.data.meta.total)
        .catch(() => 0),
    ),
  );

  return counts.reduce((sum, count) => sum + count, 0);
}

export async function fetchProjectIds() {
  const response = await apiGet<ApiSuccess<PaginatedData<ProjectSummary>>>(
    '/projects?limit=100&page=1',
  );
  return response.data.items.map((project) => project.id);
}
