function maxValue(values: number[]) {
  return Math.max(...values, 1);
}

function formatTokens(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return value.toLocaleString();
}

type BarRow = {
  label: string;
  value: number;
  hint?: string;
};

type TokenUsageChartsProps = {
  byModel: Array<{ model: string; totalTokens: number; requests: number }>;
  byUser: Array<{ userEmail: string; totalTokens: number; requests: number }>;
  timeline?: {
    points: Array<{ date: string; totalTokens: number }>;
  };
  compact?: boolean;
};

function BarChart({
  title,
  rows,
  colorClass,
}: {
  title: string;
  rows: BarRow[];
  colorClass: string;
}) {
  const max = maxValue(rows.map((row) => row.value));

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
        No data for {title.toLowerCase()}.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-medium text-slate-300">{title}</h2>
      <ul className="mt-5 space-y-4">
        {rows.map((row) => (
          <li key={`${title}-${row.label}`}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="truncate text-slate-300" title={row.label}>
                {row.label}
              </span>
              <span className="shrink-0 text-slate-400">
                {formatTokens(row.value)}
                {row.hint ? ` · ${row.hint}` : ''}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${colorClass}`}
                style={{ width: `${(row.value / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TimelineChart({
  points,
  compact,
}: {
  points: Array<{ date: string; totalTokens: number }>;
  compact?: boolean;
}) {
  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
        No token usage in this period yet.
      </div>
    );
  }

  const max = maxValue(points.map((point) => point.totalTokens));
  const height = compact ? 'h-24' : 'h-40';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-medium text-slate-300">Token usage over time</h2>
      <p className="mt-1 text-xs text-slate-500">Daily total tokens (input + output)</p>
      <div className={`mt-5 flex items-end gap-1 ${height}`}>
        {points.map((point) => (
          <div
            key={point.date}
            className="group flex min-w-0 flex-1 flex-col justify-end"
            title={`${point.date}: ${point.totalTokens.toLocaleString()} tokens`}
          >
            <div
              className="w-full rounded-t bg-violet-500/80 transition-colors group-hover:bg-violet-400"
              style={{
                height: `${Math.max((point.totalTokens / max) * 100, point.totalTokens > 0 ? 4 : 0)}%`,
              }}
            />
            {!compact && points.length <= 14 && (
              <span className="mt-1 truncate text-[10px] text-slate-500">
                {point.date.slice(5)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TokenUsageCharts({
  byModel,
  byUser,
  timeline,
  compact,
}: TokenUsageChartsProps) {
  const modelRows = [...byModel]
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, compact ? 5 : 8)
    .map((row) => ({
      label: row.model,
      value: row.totalTokens,
      hint: `${row.requests} req`,
    }));

  const userRows = [...byUser]
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, compact ? 5 : 8)
    .map((row) => ({
      label: row.userEmail,
      value: row.totalTokens,
      hint: `${row.requests} req`,
    }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <BarChart title="Tokens by model" rows={modelRows} colorClass="bg-violet-500" />
      <BarChart title="Tokens by user" rows={userRows} colorClass="bg-sky-500" />
      {timeline && (
        <div className="lg:col-span-2">
          <TimelineChart points={timeline.points} compact={compact} />
        </div>
      )}
    </div>
  );
}
