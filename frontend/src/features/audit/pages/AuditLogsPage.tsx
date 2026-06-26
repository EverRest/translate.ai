import { useState } from 'react';
import { Pagination } from '../../../shared/ui/Pagination';
import { AuditLogsTable } from '../components/AuditLogsTable';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { AUDIT_ENTITY_OPTIONS } from '../types';

const PAGE_SIZE = 20;

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');

  const { data, isLoading, error } = useAuditLogs({
    page,
    limit: PAGE_SIZE,
    entity: entity || undefined,
  });

  const items = data?.items ?? [];
  const total = data?.meta.total ?? 0;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Audit logs</h1>
        <p className="mt-1 text-sm text-slate-400">
          Tenant activity for approvals, exports, and AI provider events.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Entity</span>
          <select
            value={entity}
            onChange={(event) => {
              setEntity(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          >
            {AUDIT_ENTITY_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <p className="text-slate-400">Loading audit logs…</p>}
      {error && (
        <p className="text-red-400">
          {error instanceof Error
            ? error.message
            : 'Failed to load audit logs.'}
        </p>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">
          <p className="text-slate-400">No audit log entries found.</p>
        </div>
      )}

      {items.length > 0 && (
        <>
          <AuditLogsTable items={items} />
          <Pagination
            page={page}
            limit={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}
