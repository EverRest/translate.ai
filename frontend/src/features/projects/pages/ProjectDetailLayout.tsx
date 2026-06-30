import { NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';
import { useArchiveProject, useProject } from '../hooks/useProjects';

const tabs = [
  { to: '.', label: 'Overview', end: true },
  { to: 'keys', label: 'Keys' },
  { to: 'translations', label: 'Translations' },
  { to: 'glossary', label: 'Glossary' },
  { to: 'branches', label: 'Branches' },
  { to: 'jobs', label: 'Jobs' },
  { to: 'approvals', label: 'Approvals' },
  { to: 'settings', label: 'Settings' },
];

export function ProjectDetailLayout() {
  const confirm = useConfirm();
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const { data: project, isLoading, error } = useProject(projectId);
  const archive = useArchiveProject();

  // Derive current tab label from URL
  const segments = location.pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const currentTabLabel =
    lastSegment === projectId ? 'Overview' : (TAB_LABELS[lastSegment] ?? null);

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
    <section className="flex h-full flex-col gap-3 min-h-0">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm shrink-0">
        <NavLink
          to="/projects"
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          Projects
        </NavLink>
        <span className="text-slate-700">/</span>
        <NavLink
          to={`/projects/${project.id}`}
          className={({ isActive }) =>
            isActive && !currentTabLabel
              ? 'text-white font-medium'
              : 'text-slate-400 hover:text-slate-200 transition-colors'
          }
        >
          {project.name}
        </NavLink>
        {currentTabLabel && currentTabLabel !== 'Overview' && (
          <>
            <span className="text-slate-700">/</span>
            <span className="text-white font-medium">{currentTabLabel}</span>
          </>
        )}
      </nav>


      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Outlet context={{ project }} />
      </div>
    </section>
  );
}
