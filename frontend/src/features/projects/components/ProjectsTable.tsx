import { Link } from 'react-router-dom';
import type { Project } from '../types';

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300',
  archived: 'bg-slate-500/20 text-slate-400',
};

type ProjectsTableProps = {
  projects: Project[];
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
  archivingId?: string;
};

export function ProjectsTable({
  projects,
  onEdit,
  onArchive,
  archivingId,
}: ProjectsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Created
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/40">
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-slate-800/40">
              <td className="px-4 py-4">
                <Link
                  to={`/projects/${project.id}`}
                  className="font-medium text-white hover:text-sky-300"
                >
                  {project.name}
                </Link>
                {project.description && (
                  <p className="mt-1 max-w-md truncate text-sm text-slate-400">
                    {project.description}
                  </p>
                )}
              </td>
              <td className="px-4 py-4">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusStyles[project.status] ?? statusStyles.archived}`}
                >
                  {project.status}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-slate-400">
                {new Date(project.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(project)}
                    className="text-sm text-slate-300 hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={archivingId === project.id}
                    onClick={() => onArchive(project)}
                    className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    {archivingId === project.id ? 'Archiving…' : 'Archive'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
