import type { AuditLog } from '../types';

type AuditLogsTableProps = {
  items: AuditLog[];
};

function formatPayload(payload: AuditLog['payload']) {
  if (!payload || Object.keys(payload).length === 0) {
    return '—';
  }

  return JSON.stringify(payload);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function AuditLogsTable({ items }: AuditLogsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              User
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Entity
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Action
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/40">
          {items.map((log) => (
            <tr key={log.id} className="align-top hover:bg-slate-800/40">
              <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-300">
                {formatDate(log.createdAt)}
              </td>
              <td className="px-4 py-4 text-sm text-slate-300">
                {log.userEmail ?? 'System'}
              </td>
              <td className="px-4 py-4 text-sm text-slate-300">
                <span className="capitalize">
                  {log.entity.replace('_', ' ')}
                </span>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {log.entityId}
                </p>
              </td>
              <td className="px-4 py-4 text-sm">
                <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-200">
                  {log.action}
                </span>
              </td>
              <td className="max-w-md px-4 py-4 text-sm text-slate-400">
                <p
                  className="truncate font-mono text-xs"
                  title={formatPayload(log.payload)}
                >
                  {formatPayload(log.payload)}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
