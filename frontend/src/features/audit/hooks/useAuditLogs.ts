import { useQuery } from '@tanstack/react-query';
import { listAuditLogs } from '../api/audit.api';
import type { AuditLogFilters } from '../types';

export function useAuditLogs(filters: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => listAuditLogs(filters),
  });
}
