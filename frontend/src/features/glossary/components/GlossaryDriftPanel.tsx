import { useState } from 'react';
import type { TerminologyIssue } from '../api/glossary-consistency.api';
import {
  useDismissTerminologyIssue,
  useResolveTerminologyIssue,
  useScanTerminology,
  useTerminologyIssues,
} from '../hooks/useGlossaryConsistency';

type Props = {
  projectId: string;
};

export function GlossaryDriftPanel({ projectId }: Props) {
  const [pollScan, setPollScan] = useState(false);
  const [resolving, setResolving] = useState<TerminologyIssue | null>(null);
  const [canonicalValue, setCanonicalValue] = useState('');
  const [retranslate, setRetranslate] = useState(false);

  const issues = useTerminologyIssues(projectId, pollScan);
  const scan = useScanTerminology(projectId);
  const resolve = useResolveTerminologyIssue(projectId);
  const dismiss = useDismissTerminologyIssue(projectId);

  const openIssues = issues.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-white">Terminology drift</h3>
          <p className="mt-1 text-sm text-slate-400">
            Same source terms translated inconsistently — pick a canonical value
            and optionally add it to the active glossary.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPollScan(true);
            scan.mutate(undefined, {
              onSettled: () => window.setTimeout(() => setPollScan(false), 15000),
            });
          }}
          disabled={scan.isPending}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          {scan.isPending ? 'Scanning…' : 'Scan for drift'}
        </button>
      </div>

      {issues.isLoading && (
        <p className="text-sm text-slate-400">Loading issues…</p>
      )}

      {!issues.isLoading && openIssues.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          No open terminology issues. Run a scan after you have translations for
          shared UI tokens like Title or Label.
        </div>
      )}

      {openIssues.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/80 text-left text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Term</th>
                <th className="px-4 py-3 font-medium">Language</th>
                <th className="px-4 py-3 font-medium">Variants</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {openIssues.map((issue) => (
                <tr key={issue.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 text-white">{issue.sourceTerm}</td>
                  <td className="px-4 py-3 text-slate-300">{issue.language}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {issue.variants
                      .map((variant) => `${variant.value} (${variant.count})`)
                      .join(' · ')}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-300">
                    {issue.severity}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setResolving(issue);
                        setCanonicalValue(issue.variants[0]?.value ?? '');
                        setRetranslate(false);
                      }}
                      className="mr-2 text-sky-400 hover:text-sky-300"
                    >
                      Resolve
                    </button>
                    <button
                      type="button"
                      onClick={() => dismiss.mutate(issue.id)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      Dismiss
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resolving && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h4 className="text-sm font-medium text-white">
            Resolve “{resolving.sourceTerm}” ({resolving.language})
          </h4>
          <div className="mt-3 space-y-3">
            <label className="block text-sm text-slate-300">
              Canonical translation
              <select
                value={canonicalValue}
                onChange={(event) => setCanonicalValue(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
              >
                {resolving.variants.map((variant) => (
                  <option key={variant.value} value={variant.value}>
                    {variant.value} ({variant.count} keys)
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={retranslate}
                onChange={(event) => setRetranslate(event.target.checked)}
              />
              Re-translate affected keys (uses AI credits)
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={!canonicalValue || resolve.isPending}
                onClick={() => {
                  resolve.mutate(
                    {
                      issueId: resolving.id,
                      canonicalValue,
                      addToGlossary: true,
                      retranslate,
                    },
                    { onSuccess: () => setResolving(null) },
                  );
                }}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {resolve.isPending ? 'Saving…' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setResolving(null)}
                className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
