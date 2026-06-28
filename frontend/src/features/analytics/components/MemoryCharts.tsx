import type { MemoryCacheSummary } from '../types';

type MemoryChartsProps = {
  summary: MemoryCacheSummary;
};

function maxValue(values: number[]) {
  return Math.max(...values, 1);
}

export function MemoryCharts({ summary }: MemoryChartsProps) {
  const exact = summary.memoryHitExact;
  const semantic = summary.memoryHitSemantic;
  const llm = summary.llmCalls;
  const total = Math.max(summary.totalHits, 1);
  const exactPercent = Math.round((exact / total) * 100);
  const semanticPercent = Math.round((semantic / total) * 100);
  const llmPercent = Math.max(0, 100 - exactPercent - semanticPercent);
  const maxTimeline = maxValue(
    summary.timeline.flatMap((point) => [point.exact, point.semantic]),
  );

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
        No translation memory activity recorded for the selected filters.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2">
        <h2 className="text-sm font-medium text-slate-300">
          Cache source mix
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Share of translation lookups served by exact memory, semantic memory, or
          LLM.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-6">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full border-8 border-slate-800"
            style={{
              background: `conic-gradient(#38bdf8 0 ${exactPercent}%, #a855f7 ${exactPercent}% ${exactPercent + semanticPercent}%, #334155 ${exactPercent + semanticPercent}% 100%)`,
            }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {Math.round(summary.combinedHitRate * 100)}%
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-slate-300">
              <span className="text-slate-400">Exact:</span>{' '}
              {exact.toLocaleString()} ({exactPercent}%)
            </p>
            <p className="text-slate-300">
              <span className="text-slate-400">Semantic:</span>{' '}
              {semantic.toLocaleString()} ({semanticPercent}%)
            </p>
            <p className="text-slate-300">
              <span className="text-slate-400">LLM:</span>{' '}
              {llm.toLocaleString()} ({llmPercent}%)
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2">
        <h2 className="text-sm font-medium text-slate-300">
          Memory hits over time
        </h2>
        {summary.timeline.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            No daily memory hits in this range.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {summary.timeline.map((point) => (
              <li key={point.date}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-400">{point.date}</span>
                  <span className="text-slate-300">
                    exact {point.exact} · semantic {point.semantic}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{
                        width: `${(point.exact / maxTimeline) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{
                        width: `${(point.semantic / maxTimeline) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
