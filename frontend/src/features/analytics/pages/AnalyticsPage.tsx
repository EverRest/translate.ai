import { useMemo, useState } from 'react';
import { useProjectsList } from '../../projects/hooks/useProjects';
import { ProviderCharts } from '../components/ProviderCharts';
import { TokenUsageCharts } from '../components/TokenUsageCharts';
import { QualityCharts } from '../components/QualityCharts';
import { QualityLogsTable } from '../components/QualityLogsTable';
import { QualitySummaryStats } from '../components/QualitySummaryStats';
import { UsageLogsTable } from '../components/UsageLogsTable';
import { UsageSummaryStats } from '../components/UsageSummaryStats';
import {
  isAnalyticsForbidden,
  useCanViewAnalytics,
  useQualityLogs,
  useQualitySummary,
  useUsageLogs,
  useUsageSummary,
  useUsageTimeline,
} from '../hooks/useAnalytics';
import type { AnalyticsFilters } from '../types';

export function AnalyticsPage() {
  const canView = useCanViewAnalytics();
  const [projectId, setProjectId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filters = useMemo<AnalyticsFilters>(
    () => ({
      projectId: projectId || undefined,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
    }),
    [projectId, from, to],
  );

  const projects = useProjectsList(1, 100);
  const summary = useUsageSummary(filters, canView);
  const timeline = useUsageTimeline(filters, canView, 30);
  const logs = useUsageLogs(filters, canView);
  const qualitySummary = useQualitySummary(filters, canView);
  const qualityLogs = useQualityLogs(filters, canView);

  const forbidden =
    isAnalyticsForbidden(summary.error) ||
    isAnalyticsForbidden(logs.error) ||
    isAnalyticsForbidden(qualitySummary.error) ||
    isAnalyticsForbidden(qualityLogs.error);
  const loading =
    summary.isLoading ||
    timeline.isLoading ||
    logs.isLoading ||
    qualitySummary.isLoading ||
    qualityLogs.isLoading;
  const hasError =
    summary.isError ||
    logs.isError ||
    qualitySummary.isError ||
    qualityLogs.isError;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">
          AI usage, translation accuracy, and provider activity.
        </p>
      </div>

      {!canView && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
          Usage analytics require admin or developer role.
        </div>
      )}

      {canView && (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex min-w-48 flex-col gap-1 text-sm">
              <span className="text-slate-400">Project</span>
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              >
                <option value="">All projects</option>
                {(projects.data?.items ?? []).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">From</span>
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">To</span>
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </label>
          </div>

          {loading && <p className="text-slate-400">Loading analytics…</p>}

          {forbidden && !loading && (
            <p className="text-red-400">
              You do not have permission to view analytics.
            </p>
          )}

          {hasError && !forbidden && !loading && (
            <p className="text-red-400">
              {summary.error instanceof Error
                ? summary.error.message
                : logs.error instanceof Error
                  ? logs.error.message
                  : 'Failed to load analytics.'}
            </p>
          )}

          {!loading && !hasError && summary.data && (
            <>
              <div>
                <h2 className="text-lg font-medium text-white">AI usage</h2>
              </div>
              <UsageSummaryStats summary={summary.data} />
              <TokenUsageCharts
                byModel={summary.data.byModel}
                byUser={summary.data.byUser}
                timeline={timeline.data}
              />
              <ProviderCharts summary={summary.data} />
            </>
          )}

          {!loading && !hasError && qualitySummary.data && (
            <>
              <div>
                <h2 className="text-lg font-medium text-white">
                  Translation accuracy
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Scores from reviews, edits, and manual checks. Job outputs are
                  tracked separately until verified.
                </p>
              </div>
              <QualitySummaryStats summary={qualitySummary.data} />
              <QualityCharts summary={qualitySummary.data} />
            </>
          )}

          {!loading && !hasError && (
            <>
              <div>
                <h2 className="text-lg font-medium text-white">Recent usage</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Last {logs.data?.length ?? 0} AI calls matching filters.
                </p>
              </div>

              {(logs.data?.length ?? 0) === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">
                  <p className="text-slate-400">No usage logs recorded yet.</p>
                </div>
              ) : (
                <UsageLogsTable items={logs.data ?? []} />
              )}
            </>
          )}

          {!loading && !hasError && (
            <>
              <div>
                <h2 className="text-lg font-medium text-white">
                  Accuracy samples
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Last {qualityLogs.data?.length ?? 0} quality records matching
                  filters.
                </p>
              </div>

              {(qualityLogs.data?.length ?? 0) === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">
                  <p className="text-slate-400">
                    No accuracy metrics recorded yet.
                  </p>
                </div>
              ) : (
                <QualityLogsTable items={qualityLogs.data ?? []} />
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
