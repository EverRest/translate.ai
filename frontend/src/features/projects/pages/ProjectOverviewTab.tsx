import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { useUpdateProject } from '../hooks/useProjects';
import type { Project } from '../types';

export function ProjectOverviewTab() {
  const { project } = useOutletContext<{ project: Project }>();
  const [editOpen, setEditOpen] = useState(false);
  const update = useUpdateProject();

  return (
    <>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-slate-300">
              Project details
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1 capitalize text-white">{project.status}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Created</dt>
                <dd className="mt-1 text-white">
                  {new Date(project.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Project ID</dt>
                <dd className="mt-1 font-mono text-xs text-slate-300">
                  {project.id}
                </dd>
              </div>
            </dl>
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
          >
            Edit project
          </button>
        </div>
      </div>

      <ProjectFormModal
        open={editOpen}
        title="Edit project"
        project={project}
        loading={update.isPending}
        error={update.error instanceof Error ? update.error.message : undefined}
        onClose={() => setEditOpen(false)}
        onSubmit={(values) => {
          update.mutate(
            { projectId: project.id, input: values },
            { onSuccess: () => setEditOpen(false) },
          );
        }}
      />
    </>
  );
}
