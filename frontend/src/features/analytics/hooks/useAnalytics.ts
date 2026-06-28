import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../../../shared/api/types';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  fetchAccountUsage,
  fetchMemoryCacheSummary,
  fetchQualityLogs,
  fetchQualitySummary,
  fetchUsageLogs,
  fetchUsageSummary,
  fetchUsageTimeline,
} from '../api/analytics.api';
import type { AnalyticsFilters } from '../types';

const ANALYTICS_ROLES = new Set(['admin', 'developer']);

export function useCanViewAnalytics() {
  const { user } = useAuth();
  return user?.role ? ANALYTICS_ROLES.has(user.role) : false;
}

export function useAccountUsage(enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'account'],
    queryFn: fetchAccountUsage,
    enabled,
    retry: false,
  });
}

export function useUsageSummary(filters: AnalyticsFilters, enabled: boolean) {
  return useQuery({
    queryKey: ['analytics', 'summary', filters],
    queryFn: () => fetchUsageSummary(filters),
    enabled,
    retry: false,
  });
}

export function useUsageTimeline(
  filters: AnalyticsFilters,
  enabled: boolean,
  days = 30,
) {
  return useQuery({
    queryKey: ['analytics', 'timeline', days, filters],
    queryFn: () => fetchUsageTimeline(days, filters),
    enabled,
    retry: false,
  });
}

export function useUsageLogs(filters: AnalyticsFilters, enabled: boolean) {
  return useQuery({
    queryKey: ['analytics', 'logs', filters],
    queryFn: () => fetchUsageLogs(filters),
    enabled,
    retry: false,
  });
}

export function useQualitySummary(filters: AnalyticsFilters, enabled: boolean) {
  return useQuery({
    queryKey: ['analytics', 'quality-summary', filters],
    queryFn: () => fetchQualitySummary(filters),
    enabled,
    retry: false,
  });
}

export function useQualityLogs(filters: AnalyticsFilters, enabled: boolean) {
  return useQuery({
    queryKey: ['analytics', 'quality-logs', filters],
    queryFn: () => fetchQualityLogs(filters),
    enabled,
    retry: false,
  });
}

export function useMemoryCacheSummary(
  filters: AnalyticsFilters,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['analytics', 'cache', filters],
    queryFn: () => fetchMemoryCacheSummary(filters),
    enabled,
    retry: false,
  });
}

export function isAnalyticsForbidden(error: unknown) {
  return error instanceof ApiError && error.status === 403;
}
