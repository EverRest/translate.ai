import type { TrafficSummary, TrafficTimeline } from '../api/dashboard.api';

type TrafficChartsProps = {
  summary: TrafficSummary;
  timeline: TrafficTimeline;
};

function maxValue(values: number[]) {
  return Math.max(...values, 1);
}

export function TrafficCharts({ summary, timeline }: TrafficChartsProps) {
  const maxTimeline = maxValue(timeline.points.map((point) => point.requests));
  const maxRoute = maxValue(summary.byRoute.map((row) => row.requests));
  const maxStatus = maxValue(summary.byStatus.map((row) => row.requests));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2">
        <h2 className="text-sm font-medium text-slate-300">
          API calls over time
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Hourly request volume for the last {timeline.hours} hours.
        </p>
        {timeline.points.length === 0 ? (
          <p className="mt-6 text-sm text-slate-400">
            No API traffic recorded yet.
          </p>
        ) : (
          <div className="mt-6 flex h-40 items-end gap-2">
            {timeline.points.map((point) => (
              <div
                key={point.timestamp}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
                title={`${new Date(point.timestamp).toLocaleString()} — ${point.requests} requests`}
              >
                <div
                  className="w-full rounded-t bg-violet-500"
                  style={{
                    height: `${(point.requests / maxTimeline) * 100}%`,
                    minHeight: point.requests > 0 ? '8px' : '2px',
                  }}
                />
                <span className="truncate text-[10px] text-slate-500">
                  {new Date(point.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-medium text-slate-300">Top API routes</h2>
        <ul className="mt-5 space-y-4">
          {summary.byRoute.length === 0 ? (
            <li className="text-sm text-slate-400">No route data yet.</li>
          ) : (
            summary.byRoute.map((row) => (
              <li key={row.route}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="truncate font-mono text-slate-300">
                    {row.route}
                  </span>
                  <span className="text-slate-400">{row.requests}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{
                      width: `${(row.requests / maxRoute) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-medium text-slate-300">Status code mix</h2>
        <ul className="mt-5 space-y-4">
          {summary.byStatus.length === 0 ? (
            <li className="text-sm text-slate-400">No status data yet.</li>
          ) : (
            summary.byStatus.map((row) => (
              <li key={row.status}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{row.status}</span>
                  <span className="text-slate-400">{row.requests}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{
                      width: `${(row.requests / maxStatus) * 100}%`,
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
