export type AuditLog = {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  payload: Record<string, unknown> | null;
  userId: string | null;
  userEmail: string | null;
  createdAt: string;
};

export type AuditLogFilters = {
  page: number;
  limit: number;
  entity?: string;
};

export const AUDIT_ENTITY_OPTIONS = [
  { value: '', label: 'All entities' },
  { value: 'translation', label: 'Translation' },
  { value: 'project', label: 'Project' },
  { value: 'ai_provider', label: 'AI provider' },
] as const;
