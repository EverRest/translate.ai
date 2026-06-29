import { useEffect, useRef, useState } from 'react';
import { useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';
import type { Project } from '../../projects/types';
import {
  CreateGlossaryTermModal,
  EditGlossaryTermModal,
} from '../components/GlossaryTermFormModal';
import { GlossaryDriftPanel } from '../components/GlossaryDriftPanel';
import { GlossaryTermsTable } from '../components/GlossaryTermsTable';
import { GlossarySuggestionsTable } from '../components/GlossarySuggestionsTable';
import {
  useApplyGlossaryPreset,
  useGlossaryPresets,
} from '../hooks/useGlossaryConsistency';
import {
  useActivateGlossarySet,
  useAnalyzeGlossary,
  useApproveGlossarySuggestion,
  useCreateGlossarySet,
  useCreateGlossaryTerm,
  useDeleteGlossaryTerm,
  useGlossarySets,
  useGlossarySuggestions,
  useGlossaryTerms,
  useRejectGlossarySuggestion,
  useUpdateGlossaryTerm,
} from '../hooks/useGlossary';
import type { GlossaryTerm } from '../types';

export function ProjectGlossaryPage() {
  const confirm = useConfirm();
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  useOutletContext<{ project: Project }>();

  const tabFromUrl = searchParams.get('tab') === 'drift' ? 'drift' : 'terms';
  const applyPresetFromUrl = searchParams.get('applyPreset');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedSetId, setSelectedSetId] = useState<string | undefined>();
  const [createSetOpen, setCreateSetOpen] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [cloneFromActive, setCloneFromActive] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'terms' | 'drift'>(tabFromUrl);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  const [pollSuggestions, setPollSuggestions] = useState(false);
  const appliedPresetRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const glossarySets = useGlossarySets(projectId);
  const presets = useGlossaryPresets(projectId);
  const applyPreset = useApplyGlossaryPreset(projectId ?? '');
  const createSet = useCreateGlossarySet(projectId ?? '');
  const activateSet = useActivateGlossarySet(projectId ?? '');
  const { data, isLoading, error } = useGlossaryTerms(
    projectId,
    1,
    50,
    search,
    selectedSetId,
  );
  const create = useCreateGlossaryTerm(projectId ?? '');
  const update = useUpdateGlossaryTerm(projectId ?? '');
  const remove = useDeleteGlossaryTerm(projectId ?? '');
  const analyze = useAnalyzeGlossary(projectId ?? '');
  const suggestions = useGlossarySuggestions(projectId, pollSuggestions);
  const approve = useApproveGlossarySuggestion(projectId ?? '');
  const reject = useRejectGlossarySuggestion(projectId ?? '');

  const items = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const sets = glossarySets.data ?? [];
  const activeSet = sets.find((set) => set.isActive);
  const viewingSet = selectedSetId
    ? sets.find((set) => set.id === selectedSetId)
    : activeSet;
  const isViewingActive = !selectedSetId || viewingSet?.isActive;
  const pendingSuggestions = suggestions.data ?? [];
  const suggestionActionId = approve.isPending
    ? approve.variables
    : reject.isPending
      ? reject.variables
      : undefined;

  useEffect(() => {
    if (pendingSuggestions.length > 0) {
      setPollSuggestions(false);
    }
  }, [pendingSuggestions.length]);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    if (!applyPresetFromUrl || !projectId) {
      return;
    }
    if (appliedPresetRef.current === applyPresetFromUrl) {
      return;
    }
    appliedPresetRef.current = applyPresetFromUrl;
    applyPreset.mutate(
      { presetId: applyPresetFromUrl, mode: 'merge' },
      {
        onSettled: () => {
          const next = new URLSearchParams(searchParams);
          next.delete('applyPreset');
          setSearchParams(next, { replace: true });
        },
      },
    );
  }, [applyPresetFromUrl, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setTab = (tab: 'terms' | 'drift') => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    if (tab === 'drift') {
      next.set('tab', 'drift');
    } else {
      next.delete('tab');
    }
    setSearchParams(next, { replace: true });
  };

  if (!projectId) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-white">Glossary</h2>
          <p className="mt-1 text-sm text-slate-400">
            {total} term{total === 1 ? '' : 's'} in{' '}
            {viewingSet?.name ?? 'active set'} — injected into AI translation
            prompts when that set is active.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sets.length > 0 && (
            <select
              value={selectedSetId ?? activeSet?.id ?? ''}
              onChange={(event) =>
                setSelectedSetId(
                  event.target.value === activeSet?.id
                    ? undefined
                    : event.target.value,
                )
              }
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
            >
              {sets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name}
                  {set.isActive ? ' (active)' : ''} — {set.termCount} terms
                </option>
              ))}
            </select>
          )}
          {viewingSet && !viewingSet.isActive && (
            <button
              type="button"
              onClick={() => activateSet.mutate(viewingSet.id)}
              disabled={activateSet.isPending}
              className="rounded-lg border border-sky-700 px-3 py-2 text-sm text-sky-300 hover:bg-sky-950 disabled:opacity-50"
            >
              {activateSet.isPending ? 'Activating…' : 'Activate set'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setCreateSetOpen(true)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            New set
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setPollSuggestions(true);
            analyze.mutate();
          }}
          disabled={analyze.isPending}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          {analyze.isPending ? 'Analyzing…' : 'Suggest terms'}
        </button>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={!isViewingActive}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          Add term
        </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800">
        <button
          type="button"
          onClick={() => setTab('terms')}
          className={`px-4 py-2 text-sm ${
            activeTab === 'terms'
              ? 'border-b-2 border-sky-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Terms
        </button>
        <button
          type="button"
          onClick={() => setTab('drift')}
          className={`px-4 py-2 text-sm ${
            activeTab === 'drift'
              ? 'border-b-2 border-sky-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Drift
        </button>
      </div>

      {activeTab === 'drift' ? (
        <GlossaryDriftPanel projectId={projectId} />
      ) : (
        <>
      {(presets.data?.length ?? 0) > 0 && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div>
            <label className="block text-xs text-slate-400" htmlFor="preset-select">
              Apply preset
            </label>
            <select
              id="preset-select"
              value={selectedPresetId}
              onChange={(event) => setSelectedPresetId(event.target.value)}
              className="mt-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
            >
              <option value="">Choose preset…</option>
              {presets.data?.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.terms.length} terms)
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={!selectedPresetId || applyPreset.isPending}
            onClick={() => {
              if (!selectedPresetId) return;
              applyPreset.mutate({ presetId: selectedPresetId, mode: 'merge' });
            }}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {applyPreset.isPending ? 'Applying…' : 'Apply merge'}
          </button>
          {applyPreset.isSuccess && (
            <p className="text-sm text-slate-300">
              Applied: {applyPreset.data.created} new, {applyPreset.data.updated}{' '}
              updated, {applyPreset.data.skipped} skipped.
            </p>
          )}
        </div>
      )}

      {!isViewingActive && (
        <p className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          Viewing an inactive set. Terms are read-only until you activate this
          set or switch to the active one.
        </p>
      )}

      {createSetOpen && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="text-sm font-medium text-white">Create glossary set</h3>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-slate-400" htmlFor="set-name">
                Name
              </label>
              <input
                id="set-name"
                value={newSetName}
                onChange={(event) => setNewSetName(event.target.value)}
                className="mt-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                placeholder="Legal"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={cloneFromActive}
                onChange={(event) => setCloneFromActive(event.target.checked)}
              />
              Copy terms from active set
            </label>
            <button
              type="button"
              disabled={!newSetName.trim() || createSet.isPending}
              onClick={() => {
                createSet.mutate(
                  { name: newSetName.trim(), cloneFromActive },
                  {
                    onSuccess: (created) => {
                      setCreateSetOpen(false);
                      setNewSetName('');
                      setSelectedSetId(created.id);
                    },
                  },
                );
              }}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {createSet.isPending ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setCreateSetOpen(false)}
              className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          {createSet.error instanceof Error && (
            <p className="mt-2 text-sm text-red-400">{createSet.error.message}</p>
          )}
        </div>
      )}

      {(analyze.isSuccess || analyze.error) && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
          {analyze.error instanceof Error ? (
            <p className="text-red-400">{analyze.error.message}</p>
          ) : analyze.data?.queued ? (
            <p className="text-slate-300">
              Analysis queued for {analyze.data.translationCount} translations.
              Pending suggestions appear below when the worker finishes.
            </p>
          ) : null}
        </div>
      )}

      <div>
        <h3 className="text-base font-medium text-white">Suggested terms</h3>
        <p className="mt-1 text-sm text-slate-400">
          Ranked heuristics from existing translations. Approve to add them to
          the glossary used in the next translation job.
        </p>
      </div>

      {suggestions.isLoading && (
        <p className="text-slate-400">Loading suggestions…</p>
      )}

      {!suggestions.isLoading && pendingSuggestions.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
          No pending suggestions. Run analysis after you have at least 100
          translations.
        </div>
      )}

      {pendingSuggestions.length > 0 && (
        <GlossarySuggestionsTable
          suggestions={pendingSuggestions}
          pendingId={suggestionActionId}
          onApprove={(suggestion) => approve.mutate(suggestion.id)}
          onReject={(suggestion) => reject.mutate(suggestion.id)}
        />
      )}

      <div>
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search terms…"
          className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
        />
      </div>

      {isLoading && <p className="text-slate-400">Loading glossary…</p>}
      {error && (
        <p className="text-red-400">
          {error instanceof Error ? error.message : 'Failed to load glossary.'}
        </p>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">
          <p className="text-slate-400">
            {search ? 'No terms match your search.' : 'No glossary terms yet.'}
          </p>
          {!search && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="text-sm text-sky-400 hover:text-sky-300"
              >
                Add your first term
              </button>
              <span className="text-slate-600">or</span>
              <button
                type="button"
                disabled={applyPreset.isPending}
                onClick={() =>
                  applyPreset.mutate({
                    presetId: 'ui_common_en_ru',
                    mode: 'merge',
                  })
                }
                className="text-sm text-sky-400 hover:text-sky-300 disabled:opacity-50"
              >
                {applyPreset.isPending
                  ? 'Applying preset…'
                  : 'Apply UI common (EN → RU) preset'}
              </button>
            </div>
          )}
        </div>
      )}

      {items.length > 0 && (
        <GlossaryTermsTable
          terms={items}
          onEdit={setEditingTerm}
          onDelete={async (term) => {
            if (
              await confirm({
                title: `Delete "${term.sourceTerm}"?`,
                description: 'This glossary term will be permanently deleted.',
                danger: true,
                confirmLabel: 'Delete',
              })
            ) {
              remove.mutate(term.id);
            }
          }}
          deletingId={remove.isPending ? remove.variables : undefined}
        />
      )}

      <CreateGlossaryTermModal
        open={createOpen}
        loading={create.isPending}
        error={create.error instanceof Error ? create.error.message : undefined}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => {
          create.mutate(values, { onSuccess: () => setCreateOpen(false) });
        }}
      />

      <EditGlossaryTermModal
        open={Boolean(editingTerm)}
        term={editingTerm}
        loading={update.isPending}
        error={update.error instanceof Error ? update.error.message : undefined}
        onClose={() => setEditingTerm(null)}
        onSubmit={(values) => {
          if (!editingTerm) {
            return;
          }
          update.mutate(
            { termId: editingTerm.id, input: values },
            { onSuccess: () => setEditingTerm(null) },
          );
        }}
      />
        </>
      )}
    </section>
  );
}
