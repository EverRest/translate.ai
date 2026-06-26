import type { QualityLogEntry } from '../types';

type QualityLogsTableProps = {
  items: QualityLogEntry[];
};

function formatScore(score: number) {
  return score.toFixed(3);
}

export function QualityLogsTable({ items }: QualityLogsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800 text-sm">
        <thead className="bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-400">
              Key
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">
              Lang
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">
              Score
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">
              Verdict
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">
              Source
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-400">
              When
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/40">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 font-mono text-slate-200">
                {item.translationKey}
              </td>
              <td className="px-4 py-3 text-slate-300">{item.language}</td>
              <td className="px-4 py-3 text-slate-300">
                {formatScore(item.score)}
              </td>
              <td className="px-4 py-3 capitalize text-slate-300">
                {item.verdict?.replace('_', ' ') ?? '—'}
              </td>
              <td className="px-4 py-3 capitalize text-slate-300">
                {item.source.replace('_', ' ')}
              </td>
              <td className="px-4 py-3 text-slate-400">
                {new Date(item.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
