import { useState } from 'react';
import type { LocalizationNode } from '../types';
import { NodeTypeIcon } from './nodeTypeIcons';

type ObjectTreeProps = {
  objectSlug: string;
  nodes: LocalizationNode[];
  depth?: number;
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
  onAddChild: (parentId: string, parentSlug: string) => void;
  onUpdateSourceText: (nodeId: string, sourceText: string) => void;
  onDelete: (nodeId: string) => void;
  deletingNodeId?: string;
  updatingNodeId?: string;
};

function NodeTypeBadge({ type }: { type: string }) {
  return (
    <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
      {type.replace(/_/g, ' ')}
    </span>
  );
}

function TreeNode({
  objectSlug,
  node,
  depth,
  selectedNodeId,
  onSelectNode,
  onAddChild,
  onUpdateSourceText,
  onDelete,
  deletingNodeId,
  updatingNodeId,
}: {
  objectSlug: string;
  node: LocalizationNode;
  depth: number;
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
  onAddChild: (parentId: string, parentSlug: string) => void;
  onUpdateSourceText: (nodeId: string, sourceText: string) => void;
  onDelete: (nodeId: string) => void;
  deletingNodeId?: string;
  updatingNodeId?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [draftText, setDraftText] = useState(node.sourceText ?? '');
  const hasChildren = (node.children?.length ?? 0) > 0;
  const path = `${objectSlug}.${node.slug}`;
  const isSelected = selectedNodeId === node.id;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectNode(node.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelectNode(node.id);
          }
        }}
        className={`group flex items-start gap-2 rounded-lg border px-2 py-1.5 ${
          isSelected
            ? 'border-sky-800/60 bg-sky-950/20'
            : 'border-transparent hover:border-slate-800 hover:bg-slate-900/60'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((value) => !value);
          }}
          className="mt-0.5 w-4 shrink-0 text-slate-500 hover:text-white"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {hasChildren ? (expanded ? '▾' : '▸') : '·'}
        </button>

        <NodeTypeIcon type={node.nodeType} />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-sky-300/90">
              {node.slug}
            </span>
            <NodeTypeBadge type={node.nodeType} />
            {node.translationKeyId && (
              <span className="rounded-full bg-emerald-950/50 px-2 py-0.5 text-[10px] text-emerald-400">
                materialized
              </span>
            )}
          </div>

          {node.sourceText !== null && node.sourceText !== undefined ? (
            <input
              value={draftText}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setDraftText(event.target.value)}
              onBlur={() => {
                if (draftText !== (node.sourceText ?? '')) {
                  onUpdateSourceText(node.id, draftText);
                }
              }}
              disabled={updatingNodeId === node.id}
              className="w-full rounded border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-white disabled:opacity-50"
              placeholder="Source text…"
            />
          ) : (
            <p className="text-xs text-slate-600">{path}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAddChild(node.id, node.slug);
            }}
            className="rounded px-2 py-1 text-xs text-sky-400 hover:bg-slate-800"
          >
            + child
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(node.id);
            }}
            disabled={deletingNodeId === node.id}
            className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-950/30 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {expanded &&
        node.children?.map((child) => (
          <TreeNode
            key={child.id}
            objectSlug={objectSlug}
            node={child}
            depth={depth + 1}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
            onAddChild={onAddChild}
            onUpdateSourceText={onUpdateSourceText}
            onDelete={onDelete}
            deletingNodeId={deletingNodeId}
            updatingNodeId={updatingNodeId}
          />
        ))}
    </div>
  );
}

export function ObjectTree({
  objectSlug,
  nodes,
  depth = 0,
  selectedNodeId,
  onSelectNode,
  onAddChild,
  onUpdateSourceText,
  onDelete,
  deletingNodeId,
  updatingNodeId,
}: ObjectTreeProps) {
  if (nodes.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
        No nodes yet. Add a root section or field to start building the
        structure.
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          objectSlug={objectSlug}
          node={node}
          depth={depth}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          onAddChild={onAddChild}
          onUpdateSourceText={onUpdateSourceText}
          onDelete={onDelete}
          deletingNodeId={deletingNodeId}
          updatingNodeId={updatingNodeId}
        />
      ))}
    </div>
  );
}
