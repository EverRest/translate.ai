import type { UsageLogEntry } from '../types';

type UsageLogsTableProps = {
  items: UsageLogEntry[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function UsageLogsTable({ items }: UsageLogsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              User
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Provider
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Model
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Tokens
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Cost
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Fallback
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/40">
          {items.map((row) => (
            <tr key={row.id} className="hover:bg-slate-800/40">
              <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-300">
                {formatDate(row.createdAt)}
              </td>
              <td className="px-4 py-4 text-sm text-slate-400">
                {row.userEmail ?? '—'}
              </td>
              <td className="px-4 py-4 text-sm capitalize text-slate-300">
                {row.provider}
              </td>
              <td className="px-4 py-4 text-sm text-slate-400">{row.model}</td>
              <td className="px-4 py-4 text-sm text-slate-300">
                {row.inputTokens} in / {row.outputTokens} out
              </td>
              <td className="px-4 py-4 text-sm text-slate-300">
                ${row.estimatedCostUsd.toFixed(4)}
              </td>
              <td className="px-4 py-4 text-sm">
                {row.usedFallback ? (
                  <span className="rounded-md bg-amber-500/20 px-2 py-1 text-amber-300">
                    {row.primaryProvider ?? 'yes'}
                  </span>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
