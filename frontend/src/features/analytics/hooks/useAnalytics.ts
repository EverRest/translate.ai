import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../../../shared/api/types';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  fetchQualityLogs,
  fetchQualitySummary,
  fetchUsageLogs,
  fetchUsageSummary,
} from '../api/analytics.api';
import type { AnalyticsFilters } from '../types';

const ANALYTICS_ROLES = new Set(['admin', 'developer']);

export function useCanViewAnalytics() {
  const { user } = useAuth();
  return user?.role ? ANALYTICS_ROLES.has(user.role) : false;
}

export function useUsageSummary(filters: AnalyticsFilters, enabled: boolean) {
  return useQuery({
    queryKey: ['analytics', 'summary', filters],
    queryFn: () => fetchUsageSummary(filters),
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

export function isAnalyticsForbidden(error: unknown) {
  return error instanceof ApiError && error.status === 403;
}
