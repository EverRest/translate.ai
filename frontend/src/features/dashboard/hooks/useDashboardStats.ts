import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../../../shared/api/types';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  fetchActiveJobsCount,
  fetchPendingReviewsCount,
  fetchProjectIds,
  fetchProjectsTotal,
  fetchRecentJobs,
  fetchTrafficSummary,
  fetchTrafficTimeline,
  fetchUsageSummary,
  fetchUsageTimeline,
} from '../api/dashboard.api';

const REVIEW_ROLES = new Set(['admin', 'reviewer']);
const ANALYTICS_ROLES = new Set(['admin', 'developer']);

export function useDashboardStats() {
  const { user } = useAuth();
  const canSeeReviews = user?.role ? REVIEW_ROLES.has(user.role) : false;
  const canSeeAnalytics = user?.role ? ANALYTICS_ROLES.has(user.role) : false;

  const projectsTotal = useQuery({
    queryKey: ['dashboard', 'projects-total'],
    queryFn: fetchProjectsTotal,
  });

  const activeJobs = useQuery({
    queryKey: ['dashboard', 'active-jobs'],
    queryFn: fetchActiveJobsCount,
  });

  const recentJobs = useQuery({
    queryKey: ['dashboard', 'recent-jobs'],
    queryFn: () => fetchRecentJobs(5),
  });

  const projectIds = useQuery({
    queryKey: ['dashboard', 'project-ids'],
    queryFn: fetchProjectIds,
    enabled: canSeeReviews,
  });

  const pendingReviews = useQuery({
    queryKey: ['dashboard', 'pending-reviews', projectIds.data],
    queryFn: () => fetchPendingReviewsCount(projectIds.data ?? []),
    enabled: canSeeReviews && Boolean(projectIds.data),
  });

  const usageSummary = useQuery({
    queryKey: ['dashboard', 'usage-summary'],
    queryFn: fetchUsageSummary,
    enabled: canSeeAnalytics,
    retry: false,
  });

  const usageTimeline = useQuery({
    queryKey: ['dashboard', 'usage-timeline'],
    queryFn: () => fetchUsageTimeline(30),
    enabled: canSeeAnalytics,
    retry: false,
  });

  const trafficSummary = useQuery({
    queryKey: ['dashboard', 'traffic-summary'],
    queryFn: () => fetchTrafficSummary(24),
    enabled: canSeeAnalytics,
    retry: false,
  });

  const trafficTimeline = useQuery({
    queryKey: ['dashboard', 'traffic-timeline'],
    queryFn: () => fetchTrafficTimeline(24),
    enabled: canSeeAnalytics,
    retry: false,
  });

  const isLoading =
    projectsTotal.isLoading ||
    activeJobs.isLoading ||
    recentJobs.isLoading ||
    (canSeeReviews && (projectIds.isLoading || pendingReviews.isLoading)) ||
    (canSeeAnalytics &&
      (usageSummary.isLoading ||
        usageTimeline.isLoading ||
        trafficSummary.isLoading ||
        trafficTimeline.isLoading));

  return {
    projectsTotal: projectsTotal.data ?? 0,
    activeJobs: activeJobs.data ?? 0,
    pendingReviews: canSeeReviews ? (pendingReviews.data ?? 0) : null,
    recentJobs: recentJobs.data ?? [],
    usageSummary: usageSummary.data,
    usageTimeline: usageTimeline.data,
    trafficSummary: trafficSummary.data,
    trafficTimeline: trafficTimeline.data,
    usageForbidden:
      usageSummary.error instanceof ApiError &&
      usageSummary.error.status === 403,
    trafficForbidden:
      trafficSummary.error instanceof ApiError &&
      trafficSummary.error.status === 403,
    canSeeReviews,
    canSeeAnalytics,
    isLoading,
    hasError: projectsTotal.isError || activeJobs.isError || recentJobs.isError,
  };
}
