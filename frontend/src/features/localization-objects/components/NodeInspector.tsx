import { useEffect, useState } from 'react';
import { CONTENT_TYPE_OPTIONS } from '../../translation-keys/contentTypes';
import type { LocalizationNode, UpdateLocalizationNodeInput } from '../types';
import { NODE_TYPE_OPTIONS } from '../types';
import { NodeTypeIcon } from './nodeTypeIcons';

type NodeInspectorProps = {
  node: LocalizationNode | null;
  loading?: boolean;
  onUpdate: (nodeId: string, input: UpdateLocalizationNodeInput) => void;
};

export function NodeInspector({ node, loading, onUpdate }: NodeInspectorProps) {
  const [label, setLabel] = useState('');
  const [contentType, setContentType] = useState('');
  const [description, setDescription] = useState('');
  const [context, setContext] = useState('');

  useEffect(() => {
    if (!node) {
      return;
    }
    setLabel(node.label ?? '');
    setContentType(node.contentType ?? '');
    setDescription(node.description ?? '');
    setContext(node.context ?? '');
  }, [node]);

  if (!node) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <p className="text-sm text-slate-500">
          Select a node in the tree to inspect metadata.
        </p>
      </div>
    );
  }

  const isLeaf = node.sourceText !== null && node.sourceText !== undefined;

  const saveIfChanged = (
    field: keyof UpdateLocalizationNodeInput,
    value: string | null,
    current: string | null | undefined,
  ) => {
    const normalized = value ?? null;
    const existing = current ?? null;
    if (normalized !== existing) {
      onUpdate(node.id, { [field]: normalized });
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
      <div className="mb-4 flex items-center gap-2">
        <NodeTypeIcon type={node.nodeType} />
        <div>
          <p className="font-mono text-xs text-sky-300/90">{node.slug}</p>
          <p className="text-sm text-slate-300">
            {NODE_TYPE_OPTIONS.find((option) => option.value === node.nodeType)
              ?.label ?? node.nodeType}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="text-xs text-slate-500">Label</span>
          <input
            value={label}
            disabled={loading}
            onChange={(event) => setLabel(event.target.value)}
            onBlur={() => saveIfChanged('label', label || null, node.label)}
            className="w-full rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-sm text-white disabled:opacity-50"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-slate-500">Content type</span>
          <select
            value={contentType}
            disabled={loading || !isLeaf}
            onChange={(event) => {
              const next = event.target.value;
              setContentType(next);
              saveIfChanged('contentType', next || null, node.contentType);
            }}
            className="w-full rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {CONTENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value || 'auto'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-slate-500">Description</span>
          <textarea
            value={description}
            disabled={loading}
            rows={2}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={() =>
              saveIfChanged(
                'description',
                description || null,
                node.description,
              )
            }
            className="w-full rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-sm text-white disabled:opacity-50"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-slate-500">Context</span>
          <textarea
            value={context}
            disabled={loading}
            rows={3}
            onChange={(event) => setContext(event.target.value)}
            onBlur={() =>
              saveIfChanged('context', context || null, node.context)
            }
            className="w-full rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-sm text-white disabled:opacity-50"
            placeholder="Hints for translators or AI…"
          />
        </label>
      </div>
    </div>
  );
}
