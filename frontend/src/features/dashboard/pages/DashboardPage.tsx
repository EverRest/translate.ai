import { Link } from 'react-router-dom';
import { TokenUsageCharts } from '../../analytics/components/TokenUsageCharts';
import { useAuth } from '../../auth/hooks/useAuth';
import { RecentJobsList } from '../components/RecentJobsList';
import { StatCard } from '../components/StatCard';
import { TrafficCharts } from '../components/TrafficCharts';
import { UsageSummaryCard } from '../components/UsageSummaryCard';
import { useDashboardStats } from '../hooks/useDashboardStats';

export function DashboardPage() {
  const { user } = useAuth();
  const stats = useDashboardStats();

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Overview for {user?.email ?? 'your workspace'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/projects"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            New project
          </Link>
          <Link
            to="/jobs"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 hover:text-white"
          >
            New job
          </Link>
        </div>
      </div>

      {stats.hasError && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          Some dashboard data failed to load. Check your connection and try
          refreshing.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Projects"
          value={stats.projectsTotal}
          loading={stats.isLoading}
        />
        <StatCard
          label="Active jobs"
          value={stats.activeJobs}
          hint="Pending or processing"
          loading={stats.isLoading}
        />
        <StatCard
          label="Pending reviews"
          value={stats.pendingReviews === null ? '—' : stats.pendingReviews}
          hint={
            stats.canSeeReviews
              ? 'Draft or in review'
              : 'Requires reviewer role'
          }
          loading={stats.isLoading && stats.canSeeReviews}
        />
        {stats.canSeeAnalytics && (
          <StatCard
            label="API calls (24h)"
            value={stats.trafficSummary?.totalRequests ?? 0}
            hint={
              stats.trafficSummary
                ? `Avg ${stats.trafficSummary.avgDurationMs} ms`
                : 'Client traffic to API'
            }
            loading={stats.isLoading}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-300">Recent jobs</h2>
            <Link
              to="/jobs"
              className="text-xs text-sky-400 hover:text-sky-300"
            >
              View all
            </Link>
          </div>
          <RecentJobsList jobs={stats.recentJobs} loading={stats.isLoading} />
        </div>

        <UsageSummaryCard
          summary={stats.usageSummary}
          loading={stats.canSeeAnalytics && stats.isLoading}
          forbidden={stats.usageForbidden}
          visible={stats.canSeeAnalytics || stats.usageForbidden}
        />
      </div>

        {stats.canSeeAnalytics &&
          stats.usageSummary &&
          stats.usageTimeline && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-white">
                    AI token usage
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Tokens by model and user for your tenant (last 30 days).
                  </p>
                </div>
                <Link
                  to="/analytics"
                  className="text-xs text-sky-400 hover:text-sky-300"
                >
                  Full analytics
                </Link>
              </div>
              <TokenUsageCharts
                byModel={stats.usageSummary.byModel}
                byUser={stats.usageSummary.byUser}
                timeline={stats.usageTimeline}
                compact
              />
            </div>
          )}

      {stats.canSeeAnalytics &&
        stats.trafficSummary &&
        stats.trafficTimeline && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-white">API traffic</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Client request volume and route breakdown for your tenant.
                </p>
              </div>
              <Link
                to="/analytics"
                className="text-xs text-sky-400 hover:text-sky-300"
              >
                Full analytics
              </Link>
            </div>
            <TrafficCharts
              summary={stats.trafficSummary}
              timeline={stats.trafficTimeline}
            />
          </div>
        )}

      {stats.canSeeAnalytics && stats.trafficForbidden && (
        <p className="text-sm text-slate-400">
          API traffic charts require admin or developer role.
        </p>
      )}
    </section>
  );
}
