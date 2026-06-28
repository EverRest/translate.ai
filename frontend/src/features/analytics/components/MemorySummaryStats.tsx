import type { MemoryCacheSummary } from '../types';

type MemorySummaryStatsProps = {
  summary: MemoryCacheSummary;
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function MemorySummaryStats({ summary }: MemorySummaryStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="text-sm text-slate-400">Exact memory hits</p>
        <p className="mt-2 text-2xl font-semibold text-white">
          {summary.memoryHitExact.toLocaleString()}
        </p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="text-sm text-slate-400">Semantic memory hits</p>
        <p className="mt-2 text-2xl font-semibold text-white">
          {summary.memoryHitSemantic.toLocaleString()}
        </p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="text-sm text-slate-400">Combined hit rate</p>
        <p className="mt-2 text-2xl font-semibold text-white">
          {formatPercent(summary.combinedHitRate)}
        </p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="text-sm text-slate-400">LLM calls</p>
        <p className="mt-2 text-2xl font-semibold text-white">
          {summary.llmCalls.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
