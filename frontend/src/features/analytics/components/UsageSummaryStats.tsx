import type { UsageSummary } from '../types';

type UsageSummaryStatsProps = {
  summary: UsageSummary;
};

export function UsageSummaryStats({ summary }: UsageSummaryStatsProps) {
  const cards = [
    {
      label: 'Total tokens',
      value: summary.totalTokens.toLocaleString(),
    },
    {
      label: 'Input / output',
      value: `${summary.totalInputTokens.toLocaleString()} / ${summary.totalOutputTokens.toLocaleString()}`,
    },
    {
      label: 'Estimated cost',
      value: `$${summary.totalCostUsd.toFixed(4)}`,
    },
    {
      label: 'AI requests',
      value: summary.totalRequests.toLocaleString(),
    },
    {
      label: 'Models used',
      value: summary.byModel.length.toLocaleString(),
    },
    {
      label: 'Active users',
      value: summary.byUser.length.toLocaleString(),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <p className="text-sm text-slate-400">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
