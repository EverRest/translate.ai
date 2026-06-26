import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import type { Project } from '../../projects/types';
import {
  CreateGlossaryTermModal,
  EditGlossaryTermModal,
} from '../components/GlossaryTermFormModal';
import { GlossaryTermsTable } from '../components/GlossaryTermsTable';
import {
  useCreateGlossaryTerm,
  useDeleteGlossaryTerm,
  useGlossaryTerms,
  useUpdateGlossaryTerm,
} from '../hooks/useGlossary';
import type { GlossaryTerm } from '../types';

export function ProjectGlossaryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  useOutletContext<{ project: Project }>();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, error } = useGlossaryTerms(projectId, 1, 50, search);
  const create = useCreateGlossaryTerm(projectId ?? '');
  const update = useUpdateGlossaryTerm(projectId ?? '');
  const remove = useDeleteGlossaryTerm(projectId ?? '');

  const items = data?.items ?? [];
  const total = data?.meta.total ?? 0;

  if (!projectId) {
    return null;
  }

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
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
        >
          Add term
        </button>
      </div>

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
          onDelete={(term) => {
            if (window.confirm(`Delete glossary term "${term.sourceTerm}"?`)) {
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
    </section>
  );
}
