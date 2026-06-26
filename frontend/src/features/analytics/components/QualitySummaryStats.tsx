import type { QualitySummary } from '../types';

type QualitySummaryStatsProps = {
  summary: QualitySummary;
};

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function QualitySummaryStats({ summary }: QualitySummaryStatsProps) {
  const cards = [
    {
      label: 'Verified samples',
      value: summary.verifiedSamples.toLocaleString(),
    },
    {
      label: 'Average score',
      value: summary.avgScore.toFixed(3),
    },
    {
      label: 'Accurate rate',
      value: formatPercent(summary.accurateRate),
    },
    {
      label: 'Total samples',
      value: summary.totalSamples.toLocaleString(),
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
