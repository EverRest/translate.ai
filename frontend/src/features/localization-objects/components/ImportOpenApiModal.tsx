import { useEffect, useState } from 'react';
import { Modal } from '../../../shared/ui/Modal';
import type { OpenApiPreviewResult } from '../types';

type ImportOpenApiModalProps = {
  open: boolean;
  collectionName?: string;
  loadingPreview?: boolean;
  loadingImport?: boolean;
  preview?: OpenApiPreviewResult | null;
  error?: string;
  onClose: () => void;
  onPreview: (spec: string, selectedTags: string[]) => void;
  onImport: (spec: string, selectedTags: string[], materialize: boolean) => void;
};

export function ImportOpenApiModal({
  open,
  collectionName,
  loadingPreview,
  loadingImport,
  preview,
  error,
  onClose,
  onPreview,
  onImport,
}: ImportOpenApiModalProps) {
  const [spec, setSpec] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [materialize, setMaterialize] = useState(true);

  useEffect(() => {
    if (open) {
      setSpec('');
      setSelectedTags([]);
      setMaterialize(true);
    }
  }, [open]);

  useEffect(() => {
    if (preview?.availableTags.length && selectedTags.length === 0) {
      setSelectedTags(preview.availableTags);
    }
  }, [preview, selectedTags.length]);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  };

  return (
    <Modal open={open} title="Import from OpenAPI" onClose={onClose}>
      <div className="space-y-4">
        {collectionName && (
          <p className="text-sm text-slate-400">
            Target collection: <span className="text-white">{collectionName}</span>
          </p>
        )}

        <label className="block space-y-1">
          <span className="text-sm text-slate-400">OpenAPI JSON spec</span>
          <textarea
            value={spec}
            onChange={(event) => setSpec(event.target.value)}
            rows={10}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white"
            placeholder='{"openapi":"3.0.0","info":{...},"paths":{...}}'
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {preview && (
          <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            {preview.warnings.map((warning) => (
              <p key={warning} className="text-xs text-amber-400">
                {warning}
              </p>
            ))}

            <p className="text-sm text-slate-300">Tags to import</p>
            <div className="flex flex-wrap gap-2">
              {preview.availableTags.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={[
                      'rounded-full px-3 py-1 text-xs',
                      active
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-800 text-slate-400',
                    ].join(' ')}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-slate-400">
              {preview.entities
                .filter((entity) => selectedTags.includes(entity.tag))
                .map((entity) => (
                  <li key={entity.slug}>
                    {entity.name}{' '}
                    <span className="text-slate-600">
                      ({entity.nodeCount} nodes)
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={materialize}
            onChange={(event) => setMaterialize(event.target.checked)}
          />
          Materialize keys after import
        </label>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!spec.trim() || loadingPreview}
            onClick={() => onPreview(spec, selectedTags)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loadingPreview ? 'Previewing…' : 'Preview'}
          </button>
          <button
            type="button"
            disabled={!spec.trim() || !preview || selectedTags.length === 0 || loadingImport}
            onClick={() => onImport(spec, selectedTags, materialize)}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {loadingImport ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
