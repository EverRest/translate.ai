import { useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';
import type { Project } from '../../projects/types';
import { CreateObjectModal } from '../components/CreateObjectModal';
import {
  formatObjectProgress,
  formatRelativeTime,
} from '../utils/object-display.utils';
import {
  useCreateLocalizationObject,
  useDeleteLocalizationObject,
  useLocalizationObjects,
} from '../hooks/useLocalizationObjects';

function TemplateBadge({ type }: { type: string }) {
  return (
    <span className="rounded-full bg-sky-950/50 px-2 py-0.5 text-xs text-sky-300">
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors =
    status === 'materialized'
      ? 'bg-emerald-950/50 text-emerald-300'
      : 'bg-slate-800 text-slate-400';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${colors}`}>
      {status}
    </span>
  );
}

export function ProjectObjectsPage() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  useOutletContext<{ project: Project }>();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, error } = useLocalizationObjects(
    projectId,
    1,
    50,
    search,
  );
  const create = useCreateLocalizationObject(projectId ?? '');
  const remove = useDeleteLocalizationObject(projectId ?? '');

  const items = data?.items ?? [];

  if (!projectId) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-white">Objects</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Model forms, pages, and emails as nested structures. Materialize to
            flat keys for translation jobs — existing Keys workflow stays the
            same.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500"
        >
          Create object
        </button>
      </div>

      <input
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        placeholder="Search objects…"
        className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
      />

      {isLoading && <p className="text-slate-400">Loading objects…</p>}
      {error && (
        <p className="text-red-400">
          {error instanceof Error ? error.message : 'Failed to load objects.'}
        </p>
      )}

      {!isLoading && items.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-800 px-4 py-10 text-center text-sm text-slate-500">
          No objects yet. Create one to organize keys by form, page, or email.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((object) => {
          const progress = formatObjectProgress(
            object.materializedCount,
            object.nodeCount,
          );

          return (
            <article
              key={object.id}
              className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-white">{object.name}</h3>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {object.slug}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  <TemplateBadge type={object.templateType} />
                  <StatusBadge status={object.status} />
                </div>
              </div>

              {object.description && (
                <p className="mt-3 line-clamp-2 text-sm text-slate-400">
                  {object.description}
                </p>
              )}

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{progress.label}</span>
                  <span>{progress.percent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500/80 transition-all"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600">
                  Updated {formatRelativeTime(object.updatedAt)}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={`/projects/${projectId}/objects/${object.id}`}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
                >
                  Open tree
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      await confirm({
                        title: `Delete "${object.name}"?`,
                        description:
                          'The tree is removed. Materialized translation keys remain in the project.',
                        danger: true,
                        confirmLabel: 'Delete',
                      })
                    ) {
                      await remove.mutateAsync(object.id);
                    }
                  }}
                  className="rounded-lg px-3 py-1.5 text-sm text-red-400 hover:bg-red-950/30"
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <CreateObjectModal
        open={createOpen}
        loading={create.isPending}
        error={create.error instanceof Error ? create.error.message : undefined}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (values) => {
          const object = await create.mutateAsync(values);
          setCreateOpen(false);
          navigate(`/projects/${projectId}/objects/${object.id}`);
        }}
      />
    </section>
  );
}
