import { apiGet, type ApiSuccess } from '../../../shared/api/client';
import type { PaginatedData } from '../../../shared/api/types';
import type { AuditLog, AuditLogFilters } from '../types';

export async function listAuditLogs(filters: AuditLogFilters) {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });

  if (filters.entity) {
    params.set('entity', filters.entity);
  }

  const response = await apiGet<ApiSuccess<PaginatedData<AuditLog>>>(
    `/audit-logs?${params.toString()}`,
  );
  return response.data;
}
