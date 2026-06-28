import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import type { Project } from '../../projects/types';
import { deleteAllTranslationKeys } from '../api/translation-keys.api';
import {
  CreateTranslationKeyModal,
  EditTranslationKeyModal,
} from '../components/TranslationKeyFormModal';
import { TranslationKeysTable } from '../components/TranslationKeysTable';
import {
  useCreateTranslationKey,
  useDeleteTranslationKey,
  useRefetchTranslationKeys,
  useTranslationKeys,
  useUpdateTranslationKey,
} from '../hooks/useTranslationKeys';
import type { TranslationKey } from '../types';

export function ProjectKeysPage() {
  const { projectId } = useParams<{ projectId: string }>();
  useOutletContext<{ project: Project }>();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<TranslationKey | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, error } = useTranslationKeys(
    projectId,
    1,
    50,
    search,
  );
  const create = useCreateTranslationKey(projectId ?? '');
  const update = useUpdateTranslationKey(projectId ?? '');
  const remove = useDeleteTranslationKey(projectId ?? '');
  const refetch = useRefetchTranslationKeys(projectId ?? '');
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleDeleteAll = async () => {
    if (!projectId) return;
    if (
      !window.confirm(
        'Delete ALL translation keys and their translations? This cannot be undone.',
      )
    )
      return;
    setIsDeletingAll(true);
    try {
      await deleteAllTranslationKeys(projectId);
      refetch();
    } finally {
      setIsDeletingAll(false);
    }
  };

  const items = data?.items ?? [];
  const total = data?.meta.total ?? 0;

  if (!projectId) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-white">Translation keys</h2>
          <p className="mt-1 text-sm text-slate-400">
            {total} key{total === 1 ? '' : 's'} in this project
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isDeletingAll || total === 0}
            onClick={() => void handleDeleteAll()}
            className="rounded-lg border border-red-800 px-4 py-2 text-sm font-medium text-red-400 hover:border-red-600 hover:text-red-300 disabled:opacity-50"
          >
            {isDeletingAll ? 'Deleting…' : 'Delete all'}
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Add key
          </button>
        </div>
      </div>

      <div>
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search keys or descriptions…"
          className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
        />
      </div>

      {isLoading && <p className="text-slate-400">Loading keys…</p>}
      {error && (
        <p className="text-red-400">
          {error instanceof Error ? error.message : 'Failed to load keys.'}
        </p>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">
          <p className="text-slate-400">
            {search ? 'No keys match your search.' : 'No translation keys yet.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-4 text-sm text-sky-400 hover:text-sky-300"
            >
              Add your first key
            </button>
          )}
        </div>
      )}

      {items.length > 0 && (
        <TranslationKeysTable
          keys={items}
          onEdit={setEditingKey}
          onDelete={(key) => {
            if (
              window.confirm(
                `Delete key "${key.key}"? Existing translations will be removed.`,
              )
            ) {
              remove.mutate(key.id);
            }
          }}
          deletingId={remove.isPending ? remove.variables : undefined}
        />
      )}

      <CreateTranslationKeyModal
        open={createOpen}
        loading={create.isPending}
        error={create.error instanceof Error ? create.error.message : undefined}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => {
          create.mutate(
            {
              ...values,
              contentType: values.contentType || undefined,
            },
            { onSuccess: () => setCreateOpen(false) },
          );
        }}
      />

      <EditTranslationKeyModal
        open={Boolean(editingKey)}
        translationKey={editingKey}
        loading={update.isPending}
        error={update.error instanceof Error ? update.error.message : undefined}
        onClose={() => setEditingKey(null)}
        onSubmit={(values) => {
          if (!editingKey) {
            return;
          }
          update.mutate(
            {
              keyId: editingKey.id,
              input: {
                ...values,
                contentType: values.contentType || null,
              },
            },
            { onSuccess: () => setEditingKey(null) },
          );
        }}
      />
    </section>
  );
}
