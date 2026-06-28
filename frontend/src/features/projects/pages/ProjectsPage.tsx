import { useState } from 'react';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { ProjectsTable } from '../components/ProjectsTable';
import {
  useArchiveProject,
  useCreateProject,
  useProjectsList,
  useUpdateProject,
} from '../hooks/useProjects';
import type { Project } from '../types';

export function ProjectsPage() {
  const confirm = useConfirm();
  const { data, isLoading, error } = useProjectsList();
  const create = useCreateProject();
  const archive = useArchiveProject();
  const update = useUpdateProject();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const items = data?.items ?? [];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage localization projects for your tenant.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
        >
          New project
        </button>
      </div>

      {isLoading && <p className="text-slate-400">Loading projects…</p>}
      {error && (
        <p className="text-red-400">
          {error instanceof Error ? error.message : 'Failed to load projects.'}
        </p>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">
          <p className="text-slate-400">No projects yet.</p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-4 text-sm text-sky-400 hover:text-sky-300"
          >
            Create your first project
          </button>
        </div>
      )}

      {items.length > 0 && (
        <ProjectsTable
          projects={items}
          onEdit={setEditingProject}
          onArchive={async (project) => {
            if (
              await confirm({
                title: `Archive "${project.name}"?`,
                description: 'This cannot be undone.',
                danger: true,
                confirmLabel: 'Archive',
              })
            ) {
              archive.mutate(project.id);
            }
          }}
          archivingId={archive.isPending ? archive.variables : undefined}
        />
      )}

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
          if (!editingProject) {
            return;
          }
          update.mutate(
            { projectId: editingProject.id, input: values },
            { onSuccess: () => setEditingProject(null) },
          );
        }}
      />
    </section>
  );
}
