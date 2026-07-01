import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';
import type {
  ColumnDef,
  GridFetchParams,
  GridRef,
} from '../../../shared/ui/DataGrid';
import { DataGrid } from '../../../shared/ui/DataGrid';
import { Tooltip } from '../../../shared/ui/Tooltip';
import { ProjectFormModal } from '../components/ProjectFormModal';
import {
  useArchiveProject,
  useCreateProject,
  useUpdateProject,
} from '../hooks/useProjects';
import { listProjects } from '../api/projects.api';
import type { Project } from '../types';

const CHUNK_SIZE = 200;

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 border border-emerald-700/40',
  archived: 'bg-slate-700/30 text-slate-400 border border-slate-700/40',
};

export function ProjectsPage() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const create = useCreateProject();
  const archive = useArchiveProject();
  const update = useUpdateProject(); // used by Edit modal

  const [createOpen, setCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const gridRef = useRef<GridRef | null>(null);

  const archiveRef = useRef(archive);
  archiveRef.current = archive;

  // Lock column widths on first mount so columns never flex-grow
  useEffect(() => {
    const key = 'dg:projects:widths';
    if (!localStorage.getItem(key)) {
      localStorage.setItem(
        key,
        JSON.stringify({
          name: 240,
          description: 300,
          status: 100,
          keysCount: 80,
          languages: 110,
          createdAt: 120,
        }),
      );
    }
  }, []);

  const fetchFn = useCallback(async (params: GridFetchParams) => {
    const pg = Math.floor(params.offset / CHUNK_SIZE) + 1;
    const data = await listProjects(pg, CHUNK_SIZE);
    return { items: data.items, total: data.meta.total };
  }, []);

  const columns = useMemo(
    (): ColumnDef<Project>[] => [
      {
        key: 'name',
        header: 'Name',
        width: 240,
        sortable: true,
        sortValue: (r) => r.name,
        filterable: true,
        filterValue: (r) => r.name,
        render: (r) => (
          <button
            type="button"
            onClick={() => navigate(`/projects/${r.id}`)}
            className="w-full truncate text-left font-medium text-white hover:text-sky-300 transition-colors"
            title={r.name}
          >
            {r.name}
          </button>
        ),
      },
      {
        key: 'description',
        header: 'Description',
        width: 300,
        filterable: true,
        filterValue: (r) => r.description ?? '',
        render: (r) => (
          <span
            className="truncate text-sm text-slate-400"
            title={r.description ?? ''}
          >
            {r.description ?? <span className="text-slate-600">—</span>}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: 100,
        sortable: true,
        sortValue: (r) => r.status,
        filterable: true,
        filterValue: (r) => r.status,
        render: (r) => (
          <div className="flex justify-center w-full">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs capitalize ${statusStyles[r.status] ?? statusStyles.archived}`}
            >
              {r.status}
            </span>
          </div>
        ),
      },
      {
        key: 'keysCount',
        header: 'Keys',
        width: 80,
        sortable: true,
        sortValue: (r) => r.keysCount,
        render: (r) => (
          <div className="flex justify-center w-full">
            <span className="inline-flex items-center rounded-full bg-slate-700/50 px-2 py-0.5 text-xs tabular-nums text-slate-300">
              {r.keysCount}
            </span>
          </div>
        ),
      },
      {
        key: 'languages',
        header: 'Languages',
        width: 110,
        sortable: true,
        sortValue: (r) => r.languages.length,
        render: (r) => {
          const nonDefault = r.languages.filter((l) => !l.isDefault);
          if (nonDefault.length === 0)
            return (
              <div className="flex justify-center w-full">
                <span className="text-xs text-slate-600">—</span>
              </div>
            );
          return (
            <div className="flex justify-center w-full">
              <Tooltip
                side="bottom"
                content={
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {nonDefault.map((l) => (
                      <span
                        key={l.code}
                        className="rounded bg-slate-700 px-1.5 py-0.5 text-[11px] uppercase text-slate-200"
                      >
                        {l.code}
                      </span>
                    ))}
                  </div>
                }
              >
                <span className="inline-flex cursor-default items-center rounded-full border border-sky-700/40 bg-sky-600/20 px-2 py-0.5 text-xs tabular-nums text-sky-300">
                  {nonDefault.length}
                </span>
              </Tooltip>
            </div>
          );
        },
      },
      {
        key: 'createdAt',
        header: 'Created',
        width: 110,
        sortable: true,
        sortValue: (r) => r.createdAt,
        render: (r) => (
          <span className="text-sm text-slate-400">
            {new Date(r.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [navigate],
  );

  const toolbar = (
    <button
      type="button"
      onClick={() => setCreateOpen(true)}
      className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-500"
    >
      New project
    </button>
  );

  return (
    <section className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold text-white">Projects</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage localization projects for your tenant.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <DataGrid<Project>
          columns={columns}
          fetchFn={fetchFn}
          rowKey={(r) => r.id}
          chunkSize={CHUNK_SIZE}
          searchPlaceholder="Search projects…"
          toolbar={toolbar}
          emptyMessage="No projects yet."
          gridRef={gridRef}
          gridId="projects"
          rowContextMenu={(row) => [
            {
              label: 'Open',
              onClick: () => navigate(`/projects/${row.id}`),
            },
            {
              label: 'Edit',
              onClick: () => setEditingProject(row),
            },
            {
              label: 'Archive',
              variant: 'danger',
              onClick: () =>
                void confirm({
                  title: `Archive "${row.name}"?`,
                  description: 'You can no longer use it for new jobs.',
                  danger: true,
                  confirmLabel: 'Archive',
                }).then((ok) => {
                  if (ok) archiveRef.current.mutate(row.id);
                }),
            },
          ]}
        />
      </div>

      <ProjectFormModal
        open={createOpen}
        title="Create project"
        loading={create.isPending}
        error={create.error instanceof Error ? create.error.message : undefined}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => {
          create.mutate(values, { onSuccess: () => setCreateOpen(false) });
        }}
      />

      <ProjectFormModal
        open={Boolean(editingProject)}
        title="Edit project"
        project={editingProject ?? undefined}
        loading={update.isPending}
        error={update.error instanceof Error ? update.error.message : undefined}
        onClose={() => setEditingProject(null)}
        onSubmit={(values) => {
          if (!editingProject) return;
          update.mutate(
            { projectId: editingProject.id, input: values },
            { onSuccess: () => setEditingProject(null) },
          );
        }}
      />
    </section>
  );
}
