import { apiGet, type ApiSuccess } from '../../../shared/api/client';
import type {
  AnalyticsFilters,
  QualityLogEntry,
  QualitySummary,
  UsageLogEntry,
  UsageSummary,
} from '../types';

function buildQuery(filters: AnalyticsFilters) {
  const params = new URLSearchParams();

  if (filters.projectId) {
    params.set('projectId', filters.projectId);
  }
  if (filters.from) {
    params.set('from', filters.from);
  }
  if (filters.to) {
    params.set('to', filters.to);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchUsageSummary(filters: AnalyticsFilters) {
  const response = await apiGet<ApiSuccess<UsageSummary>>(
    `/analytics/usage/summary${buildQuery(filters)}`,
  );
  return response.data;
}

export async function fetchUsageLogs(filters: AnalyticsFilters) {
  const response = await apiGet<ApiSuccess<{ items: UsageLogEntry[] }>>(
    `/analytics/usage${buildQuery(filters)}`,
  );
  return response.data.items;
}

export async function fetchQualitySummary(filters: AnalyticsFilters) {
  const response = await apiGet<ApiSuccess<QualitySummary>>(
    `/analytics/quality/summary${buildQuery(filters)}`,
  );
  return response.data;
}

export async function fetchQualityLogs(filters: AnalyticsFilters) {
  const response = await apiGet<ApiSuccess<{ items: QualityLogEntry[] }>>(
    `/analytics/quality/logs${buildQuery(filters)}`,
  );
  return response.data.items;
}
