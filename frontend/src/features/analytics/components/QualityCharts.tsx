import type { QualitySummary } from '../types';

type QualityChartsProps = {
  summary: QualitySummary;
};

function maxValue(values: number[]) {
  return Math.max(...values, 1);
}

export function QualityCharts({ summary }: QualityChartsProps) {
  const maxVerdict = maxValue(summary.byVerdict.map((row) => row.count));
  const maxProvider = maxValue(summary.byProvider.map((row) => row.count));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-medium text-slate-300">
          Verdict breakdown
        </h2>
        <ul className="mt-5 space-y-4">
          {summary.byVerdict.every((row) => row.count === 0) ? (
            <li className="text-sm text-slate-400">No verified samples yet.</li>
          ) : (
            summary.byVerdict.map((row) => (
              <li key={row.verdict}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="capitalize text-slate-300">
                    {row.verdict.replace('_', ' ')}
                  </span>
                  <span className="text-slate-400">{row.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${(row.count / maxVerdict) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-medium text-slate-300">By provider</h2>
        <ul className="mt-5 space-y-4">
          {summary.byProvider.length === 0 ? (
            <li className="text-sm text-slate-400">No provider data yet.</li>
          ) : (
            summary.byProvider.map((row) => (
              <li key={row.provider}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="text-slate-300">{row.provider}</span>
                  <span className="text-slate-400">
                    {row.count} · avg {row.avgScore.toFixed(3)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{
                      width: `${(row.count / maxProvider) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
