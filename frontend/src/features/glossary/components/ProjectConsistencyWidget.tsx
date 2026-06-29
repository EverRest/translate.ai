import { Link } from 'react-router-dom';
import { useGlossarySets } from '../hooks/useGlossary';
import { useTerminologyIssues } from '../hooks/useGlossaryConsistency';

type Props = {
  projectId: string;
};

export function ProjectConsistencyWidget({ projectId }: Props) {
  const issues = useTerminologyIssues(projectId);
  const sets = useGlossarySets(projectId);

  const openCount = issues.data?.length ?? 0;
  const activeSet = sets.data?.find((set) => set.isActive);
  const glossaryHref = `/projects/${projectId}/glossary`;
  const driftHref = `${glossaryHref}?tab=drift`;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-sm font-medium text-slate-300">Terminology consistency</h2>
      <p className="mt-1 text-sm text-slate-500">
        Glossary rules and drift detection keep translations aligned across keys.
      </p>

      <dl className="mt-4 space-y-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <dt className="text-slate-500">Open drift issues</dt>
            <dd className="mt-1 text-white">
              {issues.isLoading
                ? '…'
                : openCount === 0
                  ? 'None detected'
                  : `${openCount} issue${openCount === 1 ? '' : 's'}`}
            </dd>
          </div>
          {openCount > 0 && (
            <Link
              to={driftHref}
              className="rounded-lg border border-amber-800/60 px-3 py-1.5 text-xs text-amber-200 hover:border-amber-600"
            >
              Review drift
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <dt className="text-slate-500">Active glossary</dt>
            <dd className="mt-1 text-white">
              {sets.isLoading
                ? '…'
                : activeSet
                  ? `${activeSet.name} (${activeSet.termCount} terms)`
                  : 'Not configured'}
            </dd>
          </div>
          <Link
            to={glossaryHref}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:border-slate-500"
          >
            Manage glossary
          </Link>
        </div>
      </dl>

      {!sets.isLoading && (activeSet?.termCount ?? 0) === 0 && (
        <p className="mt-4 rounded-lg border border-dashed border-slate-700 px-4 py-3 text-sm text-slate-400">
          Bootstrap terminology with the{' '}
          <Link
            to={`${glossaryHref}?applyPreset=ui_common_en_ru`}
            className="text-sky-400 hover:text-sky-300"
          >
            UI common (EN → RU)
          </Link>{' '}
          preset on the Glossary tab.
        </p>
      )}
    </div>
  );
}
