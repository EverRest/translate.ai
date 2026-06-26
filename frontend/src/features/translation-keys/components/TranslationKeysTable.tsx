import type { TranslationKey } from '../types';

type TranslationKeysTableProps = {
  keys: TranslationKey[];
  onEdit: (key: TranslationKey) => void;
  onDelete: (key: TranslationKey) => void;
  deletingId?: string;
};

export function TranslationKeysTable({
  keys,
  onEdit,
  onDelete,
  deletingId,
}: TranslationKeysTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Key
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Source text
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Context
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/40">
          {keys.map((item) => (
            <tr key={item.id} className="align-top hover:bg-slate-800/40">
              <td className="px-4 py-4">
                <p className="font-mono text-sm text-sky-300">{item.key}</p>
                {item.description && (
                  <p className="mt-1 text-xs text-slate-500">
                    {item.description}
                  </p>
                )}
              </td>
              <td className="px-4 py-4 text-sm text-slate-200">
                {item.sourceText}
              </td>
              <td className="px-4 py-4 text-sm text-slate-400">
                {item.context ?? '—'}
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="text-sm text-slate-300 hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => onDelete(item)}
                    className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    {deletingId === item.id ? 'Deleting…' : 'Delete'}
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
