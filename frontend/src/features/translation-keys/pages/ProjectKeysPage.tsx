import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { ObjectFilterChip } from '../../localization-objects/components/ObjectFilterChip';
import { useObjectFilterFromUrl } from '../../localization-objects/hooks/useObjectFilterFromUrl';
import type {
  GridRef,
  GridFetchParams,
  BulkActionDef,
  ColumnDef,
} from '../../../shared/ui/DataGrid';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';
import { DataGrid, RowMenu } from '../../../shared/ui/DataGrid';
import type { Project } from '../../projects/types';
import {
  deleteAllTranslationKeys,
  deleteTranslationKey,
  listTranslationKeys,
} from '../api/translation-keys.api';
import {
  CreateTranslationKeyModal,
  EditTranslationKeyModal,
} from '../components/TranslationKeyFormModal';
import {
  useCreateTranslationKey,
  useDeleteTranslationKey,
  useUpdateTranslationKey,
} from '../hooks/useTranslationKeys';
import type { TranslationKey } from '../types';

const CHUNK_SIZE = 50;

function ContentTypeBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-xs text-slate-600">—</span>;
  return (
    <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300">
      {type}
    </span>
  );
}

export function ProjectKeysPage() {
  const { projectId } = useParams<{ projectId: string }>();
  useOutletContext<{ project: Project }>();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<TranslationKey | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const create = useCreateTranslationKey(projectId ?? '');
  const update = useUpdateTranslationKey(projectId ?? '');
  const remove = useDeleteTranslationKey(projectId ?? '');

  const confirm = useConfirm();
  const { localizationObjectId, objectName, clearFilter } =
    useObjectFilterFromUrl();

  const gridRef = useRef<GridRef | null>(null);

  useEffect(() => {
    gridRef.current?.refetch();
  }, [localizationObjectId]);

  const keyFilter = useMemo(
    () => (localizationObjectId ? { localizationObjectId } : undefined),
    [localizationObjectId],
  );

  // ── fetchFn ────────────────────────────────────────────────────────────────
  const fetchFn = useCallback(
    async (params: GridFetchParams) => {
      const pg = Math.floor(params.offset / CHUNK_SIZE) + 1;
      const data = await listTranslationKeys(
        projectId!,
        pg,
        CHUNK_SIZE,
        params.search,
        keyFilter,
      );
      return { items: data.items, total: data.meta.total };
    },
    [projectId, keyFilter],
  );

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns = useMemo(
    (): ColumnDef<TranslationKey>[] => [
      {
        key: 'key',
        header: 'Key',
        width: 240,
        sortable: true,
        sortValue: (row) => row.key,
        filterable: true,
        filterValue: (row) => `${row.key} ${row.description ?? ''}`,
        render: (row) => (
          <div className="min-w-0">
            <p
              className="truncate font-mono text-xs text-slate-300"
              title={row.key}
            >
              {row.key}
            </p>
            {row.description && (
              <p
                className="truncate text-xs text-slate-500"
                title={row.description}
              >
                {row.description}
              </p>
            )}
          </div>
        ),
      },
      {
        key: 'sourceText',
        header: 'Source text',
        width: 400,
        sortable: true,
        sortValue: (row) => row.sourceText ?? '',
        filterable: true,
        filterValue: (row) => row.sourceText ?? '',
        render: (row) => (
          <span
            className="truncate text-sm text-slate-200"
            title={row.sourceText ?? ''}
          >
            {row.sourceText ?? <span className="text-slate-600">—</span>}
          </span>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        width: 120,
        filterable: true,
        filterValue: (row) => row.contentType ?? '',
        render: (row) => <ContentTypeBadge type={row.contentType} />,
      },
      {
        key: 'context',
        header: 'Context',
        width: 200,
        filterable: true,
        filterValue: (row) => row.context ?? '',
        render: (row) => (
          <span
            className="truncate text-xs text-slate-400"
            title={row.context ?? ''}
          >
            {row.context ?? <span className="text-slate-600">—</span>}
          </span>
        ),
      },
      {
        key: '_actions',
        header: '',
        width: 32,
        noPadding: true,
        overflow: 'visible',
        sticky: 'right',
        render: (row) => (
          <RowMenu
            items={[
              { label: 'Edit', onClick: () => setEditingKey(row) },
              {
                label: 'Delete',
                variant: 'danger',
                onClick: async () => {
                  if (
                    await confirm({
                      title: `Delete key "${row.key}"?`,
                      description:
                        'All existing translations for this key will be removed.',
                      danger: true,
                      confirmLabel: 'Delete',
                    })
                  ) {
                    remove.mutate(row.id, {
                      onSuccess: () => gridRef.current?.refetch(),
                    });
                  }
                },
              },
            ]}
          />
        ),
      },
    ],
    [confirm, remove],
  );

  // ── Bulk actions ───────────────────────────────────────────────────────────
  const bulkActions = useMemo(
    (): BulkActionDef<TranslationKey>[] => [
      {
        key: 'delete',
        label: 'Delete selected',
        variant: 'danger',
        onAction: async ({ selectedRows, clearSelection, refetch }) => {
          if (
            !(await confirm({
              title: `Delete ${selectedRows.length} key${selectedRows.length === 1 ? '' : 's'}?`,
              description:
                'All existing translations for these keys will be removed.',
              danger: true,
              confirmLabel: 'Delete',
            }))
          )
            return;
          if (!projectId) return;
          for (const row of selectedRows) {
            await deleteTranslationKey(projectId, row.id).catch(
              () => undefined,
            );
          }
          clearSelection();
          refetch();
        },
      },
    ],
    [projectId, confirm],
  );

  // ── Delete all ─────────────────────────────────────────────────────────────
  const handleDeleteAll = async () => {
    if (!projectId) return;
    if (
      !(await confirm({
        title: 'Delete all translation keys?',
        description:
          'All translation keys and their translations will be permanently removed. This cannot be undone.',
        danger: true,
        confirmLabel: 'Delete all',
      }))
    )
      return;
    setIsDeletingAll(true);
    try {
      await deleteAllTranslationKeys(projectId);
      gridRef.current?.refetch();
    } finally {
      setIsDeletingAll(false);
    }
  };

  // ── Toolbar ────────────────────────────────────────────────────────────────
  const toolbar = (
    <>
      <ObjectFilterChip objectName={objectName} onClear={clearFilter} />
      <button
        type="button"
        disabled={isDeletingAll}
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
    </>
  );

  if (!projectId) return null;

  return (
    <section className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex min-h-0 flex-1 flex-col">
        <DataGrid<TranslationKey>
          columns={columns}
          fetchFn={fetchFn}
          rowKey={(row) => row.id}
          chunkSize={CHUNK_SIZE}
          searchPlaceholder="Search keys or descriptions…"
          toolbar={toolbar}
          bulkActions={bulkActions}
          emptyMessage="No translation keys yet."
          gridRef={gridRef}
          gridId="keys"
        />
      </div>

      <CreateTranslationKeyModal
        open={createOpen}
        loading={create.isPending}
        error={create.error instanceof Error ? create.error.message : undefined}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => {
          create.mutate(
            { ...values, contentType: values.contentType || undefined },
            {
              onSuccess: () => {
                setCreateOpen(false);
                gridRef.current?.refetch();
              },
            },
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
          if (!editingKey) return;
          update.mutate(
            {
              keyId: editingKey.id,
              input: { ...values, contentType: values.contentType || null },
            },
            {
              onSuccess: () => {
                setEditingKey(null);
                gridRef.current?.refetch();
              },
            },
          );
        }}
      />
    </section>
  );
}
