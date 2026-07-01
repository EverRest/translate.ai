import { useEffect, useMemo } from 'react';
import { CoverageHeatmapTable } from '../../coverage/components/CoverageHeatmapTable';
import { useCoverageMatrix } from '../../coverage/hooks/useCoverageMatrix';
import { coverageMatrixToCsv } from '../../coverage/api/coverage.api';

type CoverageAnalyticsPanelProps = {
  projectId: string;
};

export function CoverageAnalyticsPanel({
  projectId,
}: CoverageAnalyticsPanelProps) {
  const { data, isLoading, isError, error } = useCoverageMatrix(projectId);

  const csvUrl = useMemo(() => {
    if (!data) return null;
    const blob = new Blob([coverageMatrixToCsv(data)], {
      type: 'text/csv;charset=utf-8',
    });
    return URL.createObjectURL(blob);
  }, [data]);

  useEffect(() => {
    return () => {
      if (csvUrl) URL.revokeObjectURL(csvUrl);
    };
  }, [csvUrl]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-white">
            Translation coverage
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Scope × language matrix — approved % drives green / yellow / red.
            Click a cell to open the translations grid filtered by scope.
          </p>
        </div>
        {csvUrl && (
          <a
            href={csvUrl}
            download="coverage-matrix.csv"
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500 hover:text-white"
          >
            Export CSV
          </a>
        )}
      </div>

      {isLoading && <p className="text-slate-400">Loading coverage matrix…</p>}
      {isError && (
        <p className="text-red-400">
          {error instanceof Error ? error.message : 'Failed to load coverage.'}
        </p>
      )}
      {data && <CoverageHeatmapTable projectId={projectId} matrix={data} />}
    </div>
  );
}
