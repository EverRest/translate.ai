import { NavLink, Outlet, useMatch } from 'react-router-dom';
import { useState, type ReactElement } from 'react';
import { useAuth, useLogout } from '../../features/auth/hooks/useAuth';
import { useProject } from '../../features/projects/hooks/useProjects';

// ─── Icons ────────────────────────────────────────────────────────────────────
function Icon({ d, d2 }: { d: string; d2?: string }) {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
      {d2 && <path d={d2} />}
    </svg>
  );
}

const NAV_ICONS: Record<string, ReactElement> = {
  '/': (
    <Icon
      d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z"
      d2="M6 15V9h4v6"
    />
  ),
  '/projects': <Icon d="M2 3h5l2 2h5v9H2V3z" />,
  '/jobs': <Icon d="M8 1v6l3 3M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14z" />,
  '/audit-logs': <Icon d="M3 4h10M3 8h10M3 12h6" />,
  '/analytics': <Icon d="M2 12l3-4 3 2 3-5 3 3" />,
  '/settings': (
    <Icon
      d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
      d2="M13.3 9a5.5 5.5 0 0 0 .2-1 5.5 5.5 0 0 0-.2-1l1.8-1.4-2-3.2-2.1.8A5.5 5.5 0 0 0 9 2.7L8.7 1h-2L6.4 2.7A5.5 5.5 0 0 0 4.7 3.4L2.6 2.4l-2 3.2L2.4 7A5.5 5.5 0 0 0 2 8c0 .34.04.68.1 1L.5 10.4l2 3.2 2.1-.8A5.5 5.5 0 0 0 6.6 13.3L7 15h2l.4-1.7a5.5 5.5 0 0 0 1.7-.7l2.1.8 2-3.2L13.3 9z"
    />
  ),
};

const PROJECT_TAB_ICONS: Record<string, ReactElement> = {
  '.': <Icon d="M2 3h5l2 2h5v9H2V3z" />,
  keys: (
    <Icon d="M10 2a4 4 0 0 1 0 8 4 4 0 0 1-3.87-3H2l-1 1-1-1 1-1H1V5h5.13A4 4 0 0 1 10 2zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  ),
  translations: (
    <Icon d="M1 4h8M5 1v3M3 9c0 2 1.5 3 2.5 4M7 9c0 2-1.5 3-2.5 4M9 4c0 5-3 9-7 9M11 3l4 10M12.5 7h2" />
  ),
  entities: (
    <Icon
      d="M8 1l6 3.5v7L8 15l-6-3.5v-7L8 1z"
      d2="M8 1v6.5M14 4.5L8 8M2 4.5L8 8"
    />
  ),
  glossary: <Icon d="M4 3h8M4 7h5M4 11h3M10 9l4 4M13 9l-4 4" />,
  branches: (
    <Icon d="M4 2v8m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 0c3 0 8-1 8-5M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
  ),
  jobs: <Icon d="M8 1v6l3 3M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14z" />,
  approvals: <Icon d="M2 8l4 4 8-8" />,
  export: <Icon d="M8 2v9M4 7l4 4 4-4M2 13h12" />,
  import: <Icon d="M8 11V2M4 6l4-4 4 4M2 13h12" />,
  settings: (
    <Icon
      d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
      d2="M13.3 9a5.5 5.5 0 0 0 .2-1 5.5 5.5 0 0 0-.2-1l1.8-1.4-2-3.2-2.1.8A5.5 5.5 0 0 0 9 2.7L8.7 1h-2L6.4 2.7A5.5 5.5 0 0 0 4.7 3.4L2.6 2.4l-2 3.2L2.4 7A5.5 5.5 0 0 0 2 8c0 .34.04.68.1 1L.5 10.4l2 3.2 2.1-.8A5.5 5.5 0 0 0 6.6 13.3L7 15h2l.4-1.7a5.5 5.5 0 0 0 1.7-.7l2.1.8 2-3.2L13.3 9z"
    />
  ),
};

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/projects', label: 'Projects', end: true },
  { to: '/jobs', label: 'Jobs' },
  { to: '/audit-logs', label: 'Audit Logs' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' },
];

const projectTabs = [
  { to: '.', label: 'Overview', end: true },
  { to: 'keys', label: 'Keys' },
  { to: 'translations', label: 'Translations' },
  { to: 'entities', label: 'Entities' },
  { to: 'glossary', label: 'Glossary' },
  { to: 'branches', label: 'Branches' },
  { to: 'jobs', label: 'Jobs' },
  { to: 'approvals', label: 'Approvals' },
  { to: 'export', label: 'Export' },
  { to: 'import', label: 'Import' },
  { to: 'settings', label: 'Settings' },
];

// ─── ProjectSubNav ────────────────────────────────────────────────────────────
function ProjectSubNav({
  projectId,
  collapsed,
}: {
  projectId: string;
  collapsed: boolean;
}) {
  const { data: project } = useProject(projectId);

  return (
    <div className="mt-1">
      <div
        className={[
          'mb-1 flex items-center gap-1.5 px-2 py-1.5',
          collapsed ? 'justify-center' : '',
        ].join(' ')}
      >
        <NavLink
          to="/projects"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-500 hover:text-slate-300 transition-colors"
          title="Back to Projects"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
        </NavLink>
        {!collapsed && (
          <span
            className="truncate text-sm font-medium text-slate-200"
            title={project?.name}
          >
            {project?.name ?? '…'}
          </span>
        )}
      </div>

      <div
        className={['flex flex-col gap-0.5', collapsed ? 'px-1' : 'pl-2'].join(
          ' ',
        )}
      >
        {projectTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={`/projects/${projectId}${tab.to === '.' ? '' : `/${tab.to}`}`}
            end={tab.end}
            title={collapsed ? tab.label : undefined}
            className={({ isActive }) =>
              [
                'flex items-center gap-2.5 rounded-lg text-sm transition-colors',
                collapsed ? 'justify-center px-2 py-2' : 'px-3 py-1.5',
                isActive
                  ? 'bg-sky-600/20 text-sky-300'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
              ].join(' ')
            }
          >
            {PROJECT_TAB_ICONS[tab.to]}
            {!collapsed && tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

// ─── AppLayout ────────────────────────────────────────────────────────────────
export function AppLayout() {
  const { user } = useAuth();
  const logout = useLogout();
  const projectMatch = useMatch('/projects/:projectId/*');
  const projectId = projectMatch?.params.projectId;

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('nav:collapsed') === '1';
    } catch {
      return false;
    }
  });

  const toggle = () => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem('nav:collapsed', next ? '1' : '0');
      } catch {
        /* */
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <aside
        className={[
          'flex flex-col border-r border-slate-800 bg-slate-900/50 transition-all duration-200',
          collapsed ? 'w-14' : 'w-56',
        ].join(' ')}
      >
        {/* Logo */}
        <div
          className={[
            'flex items-center border-b border-slate-800',
            collapsed ? 'justify-center px-2 py-3' : 'px-3 py-3',
          ].join(' ')}
        >
          {collapsed ? (
            <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="#0c1a2e"
                stroke="#1e3a5f"
                strokeWidth="1.5"
              />
              <ellipse
                cx="32"
                cy="32"
                rx="28"
                ry="9"
                fill="none"
                stroke="#1e3a5f"
                strokeWidth="1"
              />
              <path
                d="M32 4 Q44 18 32 32 Q20 46 32 60"
                fill="none"
                stroke="#1e3a5f"
                strokeWidth="1"
              />
              <ellipse
                cx="32"
                cy="32"
                rx="36"
                ry="13"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="1.5"
                transform="rotate(-30 32 32)"
              />
              <circle
                cx="62"
                cy="22"
                r="4"
                fill="#38bdf8"
                transform="rotate(-30 32 32)"
              />
              <text
                x="32"
                y="39"
                textAnchor="middle"
                fontFamily="ui-sans-serif,system-ui,sans-serif"
                fontSize="18"
                fontWeight="700"
                fill="#e2e8f0"
              >
                t.
              </text>
            </svg>
          ) : (
            <div className="flex items-center gap-2.5">
              <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="#0c1a2e"
                  stroke="#1e3a5f"
                  strokeWidth="1.5"
                />
                <ellipse
                  cx="32"
                  cy="32"
                  rx="28"
                  ry="9"
                  fill="none"
                  stroke="#1e3a5f"
                  strokeWidth="1"
                />
                <path
                  d="M32 4 Q44 18 32 32 Q20 46 32 60"
                  fill="none"
                  stroke="#1e3a5f"
                  strokeWidth="1"
                />
                <ellipse
                  cx="32"
                  cy="32"
                  rx="36"
                  ry="13"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="1.5"
                  transform="rotate(-30 32 32)"
                />
                <circle
                  cx="62"
                  cy="22"
                  r="4"
                  fill="#38bdf8"
                  transform="rotate(-30 32 32)"
                />
                <text
                  x="32"
                  y="39"
                  textAnchor="middle"
                  fontFamily="ui-sans-serif,system-ui,sans-serif"
                  fontSize="18"
                  fontWeight="700"
                  fill="#e2e8f0"
                >
                  t.
                </text>
              </svg>
              <span className="text-sm font-semibold tracking-wide text-white">
                translate.ai
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 rounded-lg text-sm transition-colors',
                  collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
                  isActive && !projectId
                    ? 'bg-sky-600/20 text-sky-300'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                ].join(' ')
              }
            >
              {NAV_ICONS[item.to]}
              {!collapsed && item.label}
            </NavLink>
          ))}

          {projectId && (
            <>
              <div className="my-2 border-t border-slate-800" />
              <ProjectSubNav projectId={projectId} collapsed={collapsed} />
            </>
          )}
        </nav>

        {/* User + collapse */}
        <div
          className={[
            'border-t border-slate-800',
            collapsed ? 'p-2' : 'p-4',
          ].join(' ')}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={toggle}
                title="Expand sidebar"
                className="flex w-full items-center justify-center rounded-lg py-2 text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M6 3l5 5-5 5M3 3l5 5-5 5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="flex w-full items-center justify-center rounded-lg py-2 text-slate-500 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M6 2H2v12h4M11 11l3-3-3-3M6 8h8" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-300">
                    {user?.email}
                  </p>
                  <p className="text-xs text-slate-500">{user?.role}</p>
                </div>
                <button
                  type="button"
                  onClick={toggle}
                  title="Collapse sidebar"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M10 3L5 8l5 5M13 3L8 8l5 5" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                onClick={logout}
                className="mt-3 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M6 2H2v12h4M11 11l3-3-3-3M6 8h8" />
                </svg>
                Sign out
              </button>
            </>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex flex-1 flex-col overflow-hidden px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
