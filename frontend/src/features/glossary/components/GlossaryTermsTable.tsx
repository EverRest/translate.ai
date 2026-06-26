import type { GlossaryTerm } from '../types';

type GlossaryTermsTableProps = {
  terms: GlossaryTerm[];
  onEdit: (term: GlossaryTerm) => void;
  onDelete: (term: GlossaryTerm) => void;
  deletingId?: string;
};

export function GlossaryTermsTable({
  terms,
  onEdit,
  onDelete,
  deletingId,
}: GlossaryTermsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Source term
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Target / rule
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Note
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/40">
          {terms.map((term) => (
            <tr key={term.id} className="align-top hover:bg-slate-800/40">
              <td className="px-4 py-4 text-sm text-white">
                {term.sourceTerm}
              </td>
              <td className="px-4 py-4 text-sm">
                {term.doNotTranslate ? (
                  <span className="rounded-md bg-amber-500/20 px-2 py-1 text-amber-300">
                    Do not translate
                  </span>
                ) : (
                  <span className="text-slate-300">
                    {term.targetTerm ?? 'Consistent translation'}
                  </span>
                )}
              </td>
              <td className="px-4 py-4 text-sm text-slate-400">
                {term.note ?? '—'}
              </td>
              <td className="px-4 py-4 text-right text-sm">
                <button
                  type="button"
                  onClick={() => onEdit(term)}
                  className="text-sky-400 hover:text-sky-300"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={deletingId === term.id}
                  onClick={() => onDelete(term)}
                  className="ml-4 text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  {deletingId === term.id ? 'Deleting…' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
