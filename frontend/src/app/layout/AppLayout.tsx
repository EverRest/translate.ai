import { NavLink, Outlet } from 'react-router-dom';
import { useAuth, useLogout } from '../../features/auth/hooks/useAuth';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/projects', label: 'Projects' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/audit-logs', label: 'Audit Logs' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' },
];

export function AppLayout() {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <aside className="flex w-56 flex-col border-r border-slate-800 bg-slate-900/50">
        <div className="border-b border-slate-800 px-5 py-5">
          <span className="text-lg font-semibold text-white">translate.ai</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-sky-600/20 text-sky-300'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <p className="truncate text-sm text-slate-300">{user?.email}</p>
          <p className="text-xs text-slate-500">{user?.role}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 text-sm text-slate-400 hover:text-white"
          >
            Sign out
          </button>
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
