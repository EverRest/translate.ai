import type { UsageSummary } from '../types';

type UsageSummaryStatsProps = {
  summary: UsageSummary;
};

export function UsageSummaryStats({ summary }: UsageSummaryStatsProps) {
  const cards = [
    {
      label: 'Total requests',
      value: summary.totalRequests.toLocaleString(),
    },
    {
      label: 'Estimated cost',
      value: `$${summary.totalCostUsd.toFixed(4)}`,
    },
    {
      label: 'Provider fallbacks',
      value: summary.fallbackCount.toLocaleString(),
    },
    {
      label: 'Providers used',
      value: summary.byProvider.length.toLocaleString(),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
