import type { UsageSummary } from '../api/dashboard.api';

type UsageSummaryCardProps = {
  summary?: UsageSummary;
  loading?: boolean;
  forbidden?: boolean;
  visible?: boolean;
};

export function UsageSummaryCard({
  summary,
  loading,
  forbidden,
  visible,
}: UsageSummaryCardProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-medium text-slate-300">AI usage</h2>

      {loading && <p className="mt-4 text-sm text-slate-400">Loading…</p>}

      {forbidden && !loading && (
        <p className="mt-4 text-sm text-slate-500">
          Usage analytics require admin or developer role.
        </p>
      )}

      {!loading && !forbidden && summary && (
        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total requests</span>
            <span className="text-white">{summary.totalRequests}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Estimated cost</span>
            <span className="text-white">
              ${summary.totalCostUsd.toFixed(4)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Provider fallbacks</span>
            <span className="text-white">{summary.fallbackCount}</span>
          </div>
          {summary.byProvider.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-slate-800 pt-3">
              {summary.byProvider.map((row) => (
                <li
                  key={row.provider}
                  className="flex justify-between text-xs text-slate-400"
                >
                  <span className="capitalize">{row.provider}</span>
                  <span>
                    {row.requests} req · ${row.estimatedCostUsd.toFixed(4)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!loading && !forbidden && !summary && (
        <p className="mt-4 text-sm text-slate-500">No AI usage recorded yet.</p>
      )}
    </div>
  );
}
