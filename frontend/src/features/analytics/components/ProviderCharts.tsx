import type { UsageSummary } from '../types';

type ProviderChartsProps = {
  summary: UsageSummary;
};

function maxValue(values: number[]) {
  return Math.max(...values, 1);
}

export function ProviderCharts({ summary }: ProviderChartsProps) {
  const maxRequests = maxValue(summary.byProvider.map((row) => row.requests));
  const maxCost = maxValue(
    summary.byProvider.map((row) => row.estimatedCostUsd),
  );
  const primaryRequests = summary.totalRequests - summary.fallbackCount;
  const fallbackPercent =
    summary.totalRequests > 0
      ? Math.round((summary.fallbackCount / summary.totalRequests) * 100)
      : 0;

  if (summary.byProvider.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
        No provider usage recorded for the selected filters.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-medium text-slate-300">
          Requests by provider
        </h2>
        <ul className="mt-5 space-y-4">
          {summary.byProvider.map((row) => (
            <li key={`requests-${row.provider}`}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="capitalize text-slate-300">
                  {row.provider}
                </span>
                <span className="text-slate-400">{row.requests}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-sky-500"
                  style={{ width: `${(row.requests / maxRequests) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-medium text-slate-300">Cost by provider</h2>
        <ul className="mt-5 space-y-4">
          {summary.byProvider.map((row) => (
            <li key={`cost-${row.provider}`}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="capitalize text-slate-300">
                  {row.provider}
                </span>
                <span className="text-slate-400">
                  ${row.estimatedCostUsd.toFixed(4)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${(row.estimatedCostUsd / maxCost) * 100}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2">
        <h2 className="text-sm font-medium text-slate-300">Fallback rate</h2>
        <p className="mt-1 text-xs text-slate-500">
          Share of AI calls that used a fallback provider.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-6">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full border-8 border-slate-800"
            style={{
              background: `conic-gradient(#f59e0b ${fallbackPercent}%, #334155 0)`,
            }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {fallbackPercent}%
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-slate-300">
              <span className="text-slate-400">Primary calls:</span>{' '}
              {primaryRequests.toLocaleString()}
            </p>
            <p className="text-slate-300">
              <span className="text-slate-400">Fallback calls:</span>{' '}
              {summary.fallbackCount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
