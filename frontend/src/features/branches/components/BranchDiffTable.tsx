import { useState } from 'react';
import { Modal } from '../../../shared/ui/Modal';
import type { BranchDiffItem } from '../types';

type BranchDiffTableProps = {
  items: BranchDiffItem[];
  branchName: string;
  canEdit: boolean;
  canMerge: boolean;
  merging?: boolean;
  savingKey?: string;
  onMerge: () => void;
  onSave: (item: BranchDiffItem, value: string) => void;
};

export function BranchDiffTable({
  items,
  branchName,
  canEdit,
  canMerge,
  merging,
  savingKey,
  onMerge,
  onSave,
}: BranchDiffTableProps) {
  const [editing, setEditing] = useState<BranchDiffItem | null>(null);
  const [editValue, setEditValue] = useState('');

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-medium text-white">
            Diff vs main — {branchName}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {items.length} change{items.length === 1 ? '' : 's'} from main
          </p>
        </div>
        {canMerge && items.length > 0 && (
          <button
            type="button"
            disabled={merging}
            onClick={onMerge}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {merging ? 'Merging…' : 'Merge to main'}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          No differences from main. Edit translations on this branch to see
          changes here.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  Key
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  Language
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  Main
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  Branch
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  Type
                </th>
                {canEdit && (
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40">
              {items.map((item) => (
                <tr key={`${item.translationKeyId}-${item.language}`}>
                  <td className="px-4 py-4 font-mono text-sm text-white">
                    {item.key}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">
                    {item.language}
                  </td>
                  <td className="max-w-xs px-4 py-4 text-sm text-slate-400">
                    {item.mainValue ?? '—'}
                  </td>
                  <td className="max-w-xs px-4 py-4 text-sm text-slate-200">
                    {item.branchValue}
                  </td>
                  <td className="px-4 py-4 text-sm capitalize text-amber-300">
                    {item.changeType}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-4 text-right text-sm">
                      <button
                        type="button"
                        disabled={
                          savingKey ===
                          `${item.translationKeyId}:${item.language}`
                        }
                        onClick={() => {
                          setEditing(item);
                          setEditValue(item.branchValue);
                        }}
                        className="text-sky-400 hover:text-sky-300 disabled:opacity-50"
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        title={`Edit ${editing?.key ?? 'translation'}`}
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSave(editing, editValue);
              setEditing(null);
            }}
          >
            <div>
              <label className="block text-sm text-slate-400">
                Language: {editing.language}
              </label>
              <textarea
                rows={4}
                value={editValue}
                onChange={(event) => setEditValue(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}
