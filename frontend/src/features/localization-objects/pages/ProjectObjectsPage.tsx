import { useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';
import type { Project } from '../../projects/types';
import { CreateCollectionModal } from '../components/CreateCollectionModal';
import { CreateObjectModal } from '../components/CreateObjectModal';
import { ImportOpenApiModal } from '../components/ImportOpenApiModal';
import {
  useCreateEntityCollection,
  useEntityCollections,
  useImportOpenApi,
  usePreviewOpenApiImport,
} from '../hooks/useEntityCollections';
import {
  formatObjectProgress,
  formatRelativeTime,
} from '../utils/object-display.utils';
import {
  useCreateLocalizationObject,
  useDeleteLocalizationObject,
  useLocalizationObjects,
} from '../hooks/useLocalizationObjects';
import type { OpenApiPreviewResult } from '../types';

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
  const [searchParams, setSearchParams] = useSearchParams();
  useOutletContext<{ project: Project }>();

  const collectionId = searchParams.get('collectionId') ?? undefined;

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [importOpenApiOpen, setImportOpenApiOpen] = useState(false);
  const [preview, setPreview] = useState<OpenApiPreviewResult | null>(null);
  const [importError, setImportError] = useState<string>();

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data: collectionsData, isLoading: collectionsLoading } =
    useEntityCollections(projectId);
  const collections = collectionsData ?? [];

  const selectedCollection = collections.find((c) => c.id === collectionId);

  const { data, isLoading, error } = useLocalizationObjects(
    projectId,
    1,
    50,
    search,
    collectionId,
  );
  const create = useCreateLocalizationObject(projectId ?? '');
  const remove = useDeleteLocalizationObject(projectId ?? '');
  const createCollection = useCreateEntityCollection(projectId ?? '');
  const previewOpenApi = usePreviewOpenApiImport(projectId ?? '', collectionId);
  const importOpenApi = useImportOpenApi(projectId ?? '', collectionId);

  const items = data?.items ?? [];

  const setCollectionFilter = (id: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (id) {
      next.set('collectionId', id);
    } else {
      next.delete('collectionId');
    }
    setSearchParams(next);
  };

  if (!projectId) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-white">Entities</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Group forms, pages, and APIs into collections. Materialize to flat
            keys for translation jobs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setImportError(undefined);
              setImportOpenApiOpen(true);
            }}
            disabled={!collectionId}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-40"
            title={collectionId ? undefined : 'Select a collection first'}
          >
            Import OpenAPI
          </button>
          <button
            type="button"
            onClick={() => setCreateCollectionOpen(true)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800"
          >
            New collection
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500"
          >
            Create entity
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-56">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Collections
          </p>
          {collectionsLoading && (
            <p className="text-sm text-slate-500">Loading…</p>
          )}
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setCollectionFilter(undefined)}
              className={[
                'w-full rounded-lg px-3 py-2 text-left text-sm',
                !collectionId
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white',
              ].join(' ')}
            >
              All entities
            </button>
            {collections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                onClick={() => setCollectionFilter(collection.id)}
                className={[
                  'w-full rounded-lg px-3 py-2 text-left text-sm',
                  collectionId === collection.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white',
                ].join(' ')}
              >
                <span className="block truncate">{collection.name}</span>
                <span className="text-xs text-slate-500">
                  {collection.entityCount} entities
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          {selectedCollection && (
            <p className="text-sm text-slate-400">
              Collection:{' '}
              <span className="text-white">{selectedCollection.name}</span>
            </p>
          )}

          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search entities…"
            className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
          />

          {isLoading && <p className="text-slate-400">Loading entities…</p>}
          {error && (
            <p className="text-red-400">
              {error instanceof Error
                ? error.message
                : 'Failed to load entities.'}
            </p>
          )}

          {!isLoading && items.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-800 px-4 py-10 text-center text-sm text-slate-500">
              No entities in this view. Create one or import from OpenAPI.
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
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
                      {object.collectionName && !collectionId && (
                        <p className="mt-1 text-xs text-slate-500">
                          {object.collectionName}
                        </p>
                      )}
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
                      to={`/projects/${projectId}/entities/${object.id}`}
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
        </div>
      </div>

      <CreateObjectModal
        open={createOpen}
        loading={create.isPending}
        collections={collections}
        defaultCollectionId={collectionId}
        error={create.error instanceof Error ? create.error.message : undefined}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (values) => {
          const object = await create.mutateAsync(values);
          setCreateOpen(false);
          navigate(`/projects/${projectId}/entities/${object.id}`);
        }}
      />

      <CreateCollectionModal
        open={createCollectionOpen}
        loading={createCollection.isPending}
        error={
          createCollection.error instanceof Error
            ? createCollection.error.message
            : undefined
        }
        onClose={() => setCreateCollectionOpen(false)}
        onSubmit={async (values) => {
          const collection = await createCollection.mutateAsync(values);
          setCreateCollectionOpen(false);
          setCollectionFilter(collection.id);
        }}
      />

      <ImportOpenApiModal
        open={importOpenApiOpen}
        collectionName={selectedCollection?.name}
        loadingPreview={previewOpenApi.isPending}
        loadingImport={importOpenApi.isPending}
        preview={preview}
        error={importError}
        onClose={() => {
          setImportOpenApiOpen(false);
          setPreview(null);
          setImportError(undefined);
        }}
        onPreview={async (spec, tags) => {
          try {
            setImportError(undefined);
            const result = await previewOpenApi.mutateAsync({
              spec,
              selectedTags: tags.length > 0 ? tags : undefined,
            });
            setPreview(result);
          } catch (err) {
            setImportError(
              err instanceof Error ? err.message : 'Preview failed',
            );
          }
        }}
        onImport={async (spec, tags, materialize) => {
          try {
            setImportError(undefined);
            const result = await importOpenApi.mutateAsync({
              spec,
              selectedTags: tags,
              materialize,
            });
            setImportOpenApiOpen(false);
            setPreview(null);
            if (!result.queued && result.entityIds?.[0]) {
              navigate(
                `/projects/${projectId}/entities/${result.entityIds[0]}`,
              );
            }
          } catch (err) {
            setImportError(
              err instanceof Error ? err.message : 'Import failed',
            );
          }
        }}
      />
    </section>
  );
}
