import type { TerminologyDriftIssue } from '../types';

type Props = {
  issues: TerminologyDriftIssue[];
  resolvingId?: string;
  onResolve: (
    issue: TerminologyDriftIssue,
    canonicalTranslation: string,
  ) => void;
};

export function TerminologyDriftTable({
  issues,
  resolvingId,
  onResolve,
}: Props) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800 text-sm">
        <thead className="bg-slate-900/80 text-left text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Source term</th>
            <th className="px-4 py-3 font-medium">Language</th>
            <th className="px-4 py-3 font-medium">Variants</th>
            <th className="px-4 py-3 font-medium">Resolve</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-950/40">
          {issues.map((issue) => (
            <tr key={issue.id}>
              <td className="px-4 py-3 font-medium text-white">
                {issue.sourceTerm}
              </td>
              <td className="px-4 py-3 uppercase text-slate-300">
                {issue.targetLang}
              </td>
              <td className="px-4 py-3">
                <ul className="space-y-2">
                  {issue.variants.map((variant) => (
                    <li key={variant.translation} className="text-slate-300">
                      <span className="font-medium text-white">
                        {variant.translation}
                      </span>
                      <span className="mt-0.5 block font-mono text-xs text-slate-500">
                        {variant.keys.join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {issue.variants.map((variant) => (
                    <button
                      key={variant.translation}
                      type="button"
                      disabled={resolvingId === issue.id}
                      onClick={() => onResolve(issue, variant.translation)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                    >
                      Use “{variant.translation}”
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TerminologyDriftBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
      {count > 99 ? '99+' : count}
    </span>
  );
}
