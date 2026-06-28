import type { GlossarySuggestion } from '../types';

type GlossarySuggestionsTableProps = {
  suggestions: GlossarySuggestion[];
  onApprove: (suggestion: GlossarySuggestion) => void;
  onReject: (suggestion: GlossarySuggestion) => void;
  pendingId?: string;
};

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function GlossarySuggestionsTable({
  suggestions,
  onApprove,
  onReject,
  pendingId,
}: GlossarySuggestionsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-900/80 text-left text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Source term</th>
            <th className="px-4 py-3 font-medium">Target</th>
            <th className="px-4 py-3 font-medium">Rule</th>
            <th className="px-4 py-3 font-medium">Confidence</th>
            <th className="px-4 py-3 font-medium">Reason</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {suggestions.map((suggestion) => (
            <tr
              key={suggestion.id}
              className="border-t border-slate-800 text-slate-200"
            >
              <td className="px-4 py-3 font-medium text-white">
                {suggestion.sourceTerm}
              </td>
              <td className="px-4 py-3">
                {suggestion.doNotTranslate
                  ? 'Do not translate'
                  : (suggestion.targetTerm ?? '—')}
              </td>
              <td className="px-4 py-3">
                {suggestion.doNotTranslate ? 'Keep source' : 'Preferred'}
              </td>
              <td className="px-4 py-3">
                {formatConfidence(suggestion.confidence)}
              </td>
              <td className="px-4 py-3 text-slate-400">
                {suggestion.reason ?? '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pendingId === suggestion.id}
                    onClick={() => onApprove(suggestion)}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === suggestion.id}
                    onClick={() => onReject(suggestion)}
                    className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
