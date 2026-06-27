import { Modal } from '../../../shared/ui/Modal';
import type { ReviewItem } from '../types';

const statusStyles: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-300',
  review: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/20 text-emerald-300',
};

type ReviewsTableProps = {
  items: ReviewItem[];
  mode: 'pending' | 'approved';
  selectedIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  onApprove?: (id: string) => void;
  onReject?: (item: ReviewItem) => void;
  onRetranslate?: (id: string) => void;
  onEdit?: (item: ReviewItem) => void;
  onPublish?: (id: string) => void;
  busyId?: string;
};

export function ReviewsTable({
  items,
  mode,
  selectedIds,
  onToggle,
  onToggleAll,
  onApprove,
  onReject,
  onRetranslate,
  onEdit,
  onPublish,
  busyId,
}: ReviewsTableProps) {
  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900/80">
          <tr>
            {mode === 'pending' && (
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() =>
                    onToggleAll(allSelected ? [] : items.map((item) => item.id))
                  }
                  aria-label="Select all"
                />
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Key
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Language
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Original
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Translation
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/40">
          {items.map((item) => (
            <tr key={item.id} className="align-top hover:bg-slate-800/40">
              {mode === 'pending' && (
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => onToggle(item.id)}
                    aria-label={`Select ${item.key}`}
                  />
                </td>
              )}
              <td className="px-4 py-4">
                <p className="font-mono text-sm text-sky-300">{item.key}</p>
              </td>
              <td className="px-4 py-4 text-sm uppercase text-slate-300">
                {item.language}
              </td>
              <td className="px-4 py-4 text-sm text-slate-400">
                {item.sourceText}
              </td>
              <td className="px-4 py-4 text-sm text-white">{item.value}</td>
              <td className="px-4 py-4">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusStyles[item.status] ?? statusStyles.draft}`}
                >
                  {item.status}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-2">
                  {mode === 'pending' && onEdit && (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => onEdit(item)}
                      className="text-sm text-slate-300 hover:text-white disabled:opacity-50"
                    >
                      Edit
                    </button>
                  )}
                  {mode === 'pending' && onRetranslate && (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => onRetranslate(item.id)}
                      className="text-sm text-sky-400 hover:text-sky-300 disabled:opacity-50"
                    >
                      Retranslate
                    </button>
                  )}
                  {mode === 'pending' && onApprove && (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => onApprove(item.id)}
                      className="text-sm text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {mode === 'pending' && onReject && (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => onReject(item)}
                      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}
                  {mode === 'approved' && onPublish && (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => onPublish(item.id)}
                      className="text-sm text-sky-400 hover:text-sky-300 disabled:opacity-50"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type EditTranslationModalProps = {
  open: boolean;
  item: ReviewItem | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSave: (value: string) => void;
};

export function EditTranslationModal({
  open,
  item,
  loading,
  error,
  onClose,
  onSave,
}: EditTranslationModalProps) {
  if (!item) {
    return null;
  }

  return (
    <Modal title="Edit translation" open={open} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const value = new FormData(form).get('value');
          if (typeof value === 'string' && value.trim()) {
            onSave(value.trim());
          }
        }}
      >
        <p className="text-sm text-slate-400">
          <span className="font-mono text-sky-300">{item.key}</span> ·{' '}
          <span className="uppercase">{item.language}</span>
        </p>
        <textarea
          name="value"
          defaultValue={item.value}
          rows={4}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

type RejectTranslationModalProps = {
  open: boolean;
  item: ReviewItem | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (comment: string) => void;
};

export function RejectTranslationModal({
  open,
  item,
  loading,
  error,
  onClose,
  onConfirm,
}: RejectTranslationModalProps) {
  if (!item) {
    return null;
  }

  return (
    <Modal title="Reject translation" open={open} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const comment = new FormData(form).get('comment');
          onConfirm(typeof comment === 'string' ? comment : '');
        }}
      >
        <p className="text-sm text-slate-400">
          Rejecting <span className="font-mono text-sky-300">{item.key}</span> (
          {item.language.toUpperCase()})
        </p>
        <textarea
          name="comment"
          rows={3}
          placeholder="Optional feedback for the translator…"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
