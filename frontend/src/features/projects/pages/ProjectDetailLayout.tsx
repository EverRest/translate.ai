import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useArchiveProject, useProject } from '../hooks/useProjects';

const tabs = [
  { to: '.', label: 'Overview', end: true },
  { to: 'keys', label: 'Keys' },
  { to: 'glossary', label: 'Glossary' },
  { to: 'branches', label: 'Branches' },
  { to: 'jobs', label: 'Jobs' },
  { to: 'approvals', label: 'Approvals' },
  { to: 'settings', label: 'Settings' },
];

export function ProjectDetailLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading, error } = useProject(projectId);
  const archive = useArchiveProject();

  if (isLoading) {
    return <p className="text-slate-400">Loading project…</p>;
  }

  if (error || !project) {
    return (
      <p className="text-red-400">
        {error instanceof Error ? error.message : 'Project not found.'}
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            <NavLink to="/projects" className="hover:text-slate-300">
              Projects
            </NavLink>{' '}
            / {project.name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              {project.description}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={archive.isPending}
          onClick={() => {
            if (
              window.confirm(
                `Archive "${project.name}"? You can no longer use it for new jobs.`,
              )
            ) {
              archive.mutate(project.id);
            }
          }}
          className="rounded-lg border border-red-900/50 px-4 py-2 text-sm text-red-300 hover:bg-red-950/30 disabled:opacity-50"
        >
          {archive.isPending ? 'Archiving…' : 'Archive project'}
        </button>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-slate-800 pb-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              [
                'rounded-t-lg px-4 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white',
              ].join(' ')
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ project }} />
    </section>
  );
}
