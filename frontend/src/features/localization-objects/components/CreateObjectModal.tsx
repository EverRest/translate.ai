import { useEffect, useState } from 'react';
import { Modal } from '../../../shared/ui/Modal';
import { TEMPLATE_TYPE_OPTIONS } from '../types';
import type { CreateLocalizationObjectInput, EntityCollectionSummary } from '../types';

type CreateObjectModalProps = {
  open: boolean;
  loading?: boolean;
  error?: string;
  collections?: EntityCollectionSummary[];
  defaultCollectionId?: string;
  onClose: () => void;
  onSubmit: (values: CreateLocalizationObjectInput) => void;
};

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^[0-9]+/, '');
}

export function CreateObjectModal({
  open,
  loading,
  error,
  collections = [],
  defaultCollectionId,
  onClose,
  onSubmit,
}: CreateObjectModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [collectionId, setCollectionId] = useState<string | undefined>();
  const [templateType, setTemplateType] =
    useState<CreateLocalizationObjectInput['templateType']>('form');

  useEffect(() => {
    if (open) {
      setName('');
      setSlug('');
      setSlugTouched(false);
      setDescription('');
      setTemplateType('form');
      setCollectionId(defaultCollectionId ?? collections[0]?.id);
    }
  }, [open, defaultCollectionId, collections]);

  useEffect(() => {
    if (!slugTouched && name) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  return (
    <Modal open={open} title="Create entity" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim() || undefined,
            templateType,
            collectionId,
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
            placeholder="Registration form"
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-slate-400">Slug</span>
          <input
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-white"
            placeholder="registration_form"
            pattern="[a-z][a-z0-9_]*"
            required
          />
        </label>

        {collections.length > 0 && (
          <label className="block space-y-1">
            <span className="text-sm text-slate-400">Collection</span>
            <select
              value={collectionId ?? ''}
              onChange={(event) => setCollectionId(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block space-y-1">
          <span className="text-sm text-slate-400">Type</span>
          <select
            value={templateType}
            onChange={(event) =>
              setTemplateType(
                event.target
                  .value as CreateLocalizationObjectInput['templateType'],
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
          <span className="text-sm text-slate-400">Description (optional)</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
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
            {loading ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
