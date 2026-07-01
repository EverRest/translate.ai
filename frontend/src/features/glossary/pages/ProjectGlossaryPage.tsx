import { useEffect, useState } from 'react';
import {
  Link,
  useOutletContext,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';
import type { Project } from '../../projects/types';
import {
  CreateGlossaryTermModal,
  EditGlossaryTermModal,
} from '../components/GlossaryTermFormModal';
import { GlossaryTermsTable } from '../components/GlossaryTermsTable';
import { GlossarySuggestionsTable } from '../components/GlossarySuggestionsTable';
import {
  TerminologyDriftBadge,
  TerminologyDriftTable,
} from '../components/TerminologyDriftTable';
import {
  useAnalyzeGlossary,
  useApproveGlossarySuggestion,
  useCreateGlossaryTerm,
  useDeleteGlossaryTerm,
  useGlossarySuggestions,
  useGlossaryTerms,
  useRejectGlossarySuggestion,
  useUpdateGlossaryTerm,
} from '../hooks/useGlossary';
import {
  useResolveTerminologyDriftIssue,
  useScanTerminologyDrift,
  useTerminologyDriftCount,
  useTerminologyDriftIssues,
} from '../hooks/useTerminologyDrift';
import type { GlossaryPageTab, GlossaryTerm } from '../types';

const tabs: Array<{ id: GlossaryPageTab; label: string }> = [
  { id: 'terms', label: 'Terms' },
  { id: 'suggestions', label: 'Suggestions' },
  { id: 'drift', label: 'Terminology drift' },
];

export function ProjectGlossaryPage() {
  const confirm = useConfirm();
  const { projectId } = useParams<{ projectId: string }>();
  useOutletContext<{ project: Project }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') as GlossaryPageTab | null;
  const [tab, setTab] = useState<GlossaryPageTab>(
    tabParam && tabs.some((item) => item.id === tabParam) ? tabParam : 'terms',
  );

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  const [pollSuggestions, setPollSuggestions] = useState(false);
  const [pollDrift, setPollDrift] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (tabParam && tabs.some((item) => item.id === tabParam)) {
      setTab(tabParam);
    }
  }, [tabParam]);

  const { data, isLoading, error } = useGlossaryTerms(projectId, 1, 50, search);
  const create = useCreateGlossaryTerm(projectId ?? '');
  const update = useUpdateGlossaryTerm(projectId ?? '');
  const remove = useDeleteGlossaryTerm(projectId ?? '');
  const analyze = useAnalyzeGlossary(projectId ?? '');
  const suggestions = useGlossarySuggestions(projectId, pollSuggestions);
  const driftIssues = useTerminologyDriftIssues(projectId, pollDrift);
  const driftCount = useTerminologyDriftCount(projectId);
  const scanDrift = useScanTerminologyDrift(projectId ?? '');
  const resolveDrift = useResolveTerminologyDriftIssue(projectId ?? '');
  const approve = useApproveGlossarySuggestion(projectId ?? '');
  const reject = useRejectGlossarySuggestion(projectId ?? '');

  const items = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const pendingSuggestions = suggestions.data ?? [];
  const openDriftIssues = driftIssues.data ?? [];
  const openDriftCount = driftCount.data ?? 0;
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
    if (openDriftIssues.length > 0) {
      setPollDrift(false);
    }
  }, [openDriftIssues.length]);

  if (!projectId) {
    return null;
  }

  const selectTab = (next: GlossaryPageTab) => {
    setTab(next);
    setSearchParams(next === 'terms' ? {} : { tab: next });
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-white">Glossary</h2>
          <p className="mt-1 text-sm text-slate-400">
            {total} term{total === 1 ? '' : 's'} — injected into AI translation
            prompts for this project.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === 'suggestions' && (
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
          )}
          {tab === 'drift' && (
            <button
              type="button"
              onClick={() => {
                setPollDrift(true);
                scanDrift.mutate();
              }}
              disabled={scanDrift.isPending}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50"
            >
              {scanDrift.isPending ? 'Scanning…' : 'Scan now'}
            </button>
          )}
          {tab === 'terms' && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
            >
              Add term
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectTab(item.id)}
            className={[
              'inline-flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm',
              tab === item.id
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white',
            ].join(' ')}
          >
            {item.label}
            {item.id === 'drift' && (
              <TerminologyDriftBadge count={openDriftCount} />
            )}
          </button>
        ))}
      </div>

      {tab === 'suggestions' && (analyze.isSuccess || analyze.error) && (
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

      {tab === 'drift' && (scanDrift.isSuccess || scanDrift.error) && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
          {scanDrift.error instanceof Error ? (
            <p className="text-red-400">{scanDrift.error.message}</p>
          ) : scanDrift.data?.queued ? (
            <p className="text-slate-300">
              Terminology scan queued. Open issues appear below when the worker
              finishes.
            </p>
          ) : null}
        </div>
      )}

      {tab === 'suggestions' && (
        <>
          <div>
            <h3 className="text-base font-medium text-white">
              Suggested terms
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Ranked heuristics from existing translations. Approve to add them
              to the glossary used in the next translation job.
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
        </>
      )}

      {tab === 'drift' && (
        <>
          <div>
            <h3 className="text-base font-medium text-white">
              Terminology drift
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Same source term translated inconsistently across keys. Pick a
              canonical variant to add a glossary rule.
            </p>
          </div>

          {driftIssues.isLoading && (
            <p className="text-slate-400">Loading drift issues…</p>
          )}

          {!driftIssues.isLoading && openDriftIssues.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
              No open drift issues. Scans run automatically after translation
              jobs when enabled in{' '}
              <Link
                to={`/projects/${projectId}/settings?tab=consistency`}
                className="text-sky-400 hover:text-sky-300"
              >
                Settings → Consistency
              </Link>
              .
            </div>
          )}

          {openDriftIssues.length > 0 && (
            <TerminologyDriftTable
              issues={openDriftIssues}
              resolvingId={
                resolveDrift.isPending
                  ? resolveDrift.variables?.issueId
                  : undefined
              }
              onResolve={(issue, canonicalTranslation) =>
                resolveDrift.mutate({ issueId: issue.id, canonicalTranslation })
              }
            />
          )}
        </>
      )}

      {tab === 'terms' && (
        <>
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
              {error instanceof Error
                ? error.message
                : 'Failed to load glossary.'}
            </p>
          )}

          {!isLoading && !error && items.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">
              <p className="text-slate-400">
                {search
                  ? 'No terms match your search.'
                  : 'No glossary terms yet.'}
              </p>
              {!search && (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="mt-4 text-sm text-sky-400 hover:text-sky-300"
                >
                  Add your first term
                </button>
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
                    description:
                      'This glossary term will be permanently deleted.',
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
        </>
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
    </section>
  );
}
