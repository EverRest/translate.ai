export function successResponse<T>(data: T) {
  return { success: true as const, data };
}

export interface PaginatedResult<T> {
  items: T[];
  meta: { page: number; limit: number; total: number };
}

export function paginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
) {
  return successResponse({ items, meta: { page, limit, total } });
}
