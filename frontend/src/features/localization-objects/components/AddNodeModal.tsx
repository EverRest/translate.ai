import { useEffect, useState } from 'react';
import { Modal } from '../../../shared/ui/Modal';
import { NODE_TYPE_OPTIONS } from '../types';
import type {
  CreateLocalizationNodeInput,
  LocalizationNodeType,
} from '../types';

type AddNodeModalProps = {
  open: boolean;
  parentSlug?: string;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: CreateLocalizationNodeInput) => void;
};

const LEAF_TYPES = new Set<LocalizationNodeType>([
  'label',
  'text',
  'button',
  'placeholder',
  'hint',
  'tooltip',
  'error',
  'validation',
  'success',
  'notification',
  'email_subject',
  'email_body',
]);

export function AddNodeModal({
  open,
  parentSlug,
  loading,
  error,
  onClose,
  onSubmit,
}: AddNodeModalProps) {
  const [slug, setSlug] = useState('');
  const [nodeType, setNodeType] = useState<LocalizationNodeType>('text');
  const [sourceText, setSourceText] = useState('');
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (open) {
      setSlug('');
      setNodeType(parentSlug ? 'text' : 'section');
      setSourceText('');
      setLabel('');
    }
  }, [open, parentSlug]);

  const showSourceText = LEAF_TYPES.has(nodeType);

  return (
    <Modal
      open={open}
      title={parentSlug ? `Add node under ${parentSlug}` : 'Add root node'}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            slug: slug.trim(),
            nodeType,
            label: label.trim() || undefined,
            sourceText: showSourceText ? sourceText.trim() : undefined,
          });
        }}
      >
        {error && <p className="text-sm text-red-400">{error}</p>}

        <label className="block space-y-1">
          <span className="text-sm text-slate-400">Slug</span>
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-white"
            placeholder="email"
            pattern="[a-z][a-z0-9_]*"
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-slate-400">Node type</span>
          <select
            value={nodeType}
            onChange={(event) =>
              setNodeType(event.target.value as LocalizationNodeType)
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            {NODE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.group} · {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-slate-400">Label (optional)</span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
        </label>

        {showSourceText && (
          <label className="block space-y-1">
            <span className="text-sm text-slate-400">Source text</span>
            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
              required
            />
          </label>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? 'Adding…' : 'Add node'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
