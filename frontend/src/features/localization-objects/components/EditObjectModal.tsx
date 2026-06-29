import { useEffect, useState } from 'react';
import { Modal } from '../../../shared/ui/Modal';
import { TEMPLATE_TYPE_OPTIONS } from '../types';
import type {
  LocalizationObjectDetail,
  UpdateLocalizationObjectInput,
} from '../types';

type EditObjectModalProps = {
  open: boolean;
  object: LocalizationObjectDetail | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: UpdateLocalizationObjectInput) => void;
};

export function EditObjectModal({
  open,
  object,
  loading,
  error,
  onClose,
  onSubmit,
}: EditObjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] =
    useState<LocalizationObjectDetail['templateType']>('form');

  useEffect(() => {
    if (open && object) {
      setName(object.name);
      setDescription(object.description ?? '');
      setTemplateType(object.templateType);
    }
  }, [open, object]);

  if (!object) {
    return null;
  }

  return (
    <Modal open={open} title="Edit object" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            name: name.trim(),
            description: description.trim() || null,
            templateType,
          });
        }}
      >
        {error && <p className="text-sm text-red-400">{error}</p>}

        <label className="block space-y-1">
          <span className="text-sm text-slate-400">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-slate-400">Slug</span>
          <input
            value={object.slug}
            disabled
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-500"
          />
          <span className="text-xs text-slate-600">
            Slug is fixed after creation to keep key paths stable.
          </span>
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-slate-400">Type</span>
          <select
            value={templateType}
            onChange={(event) =>
              setTemplateType(
                event.target.value as LocalizationObjectDetail['templateType'],
              )
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            {TEMPLATE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-slate-400">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
        </label>

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
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
