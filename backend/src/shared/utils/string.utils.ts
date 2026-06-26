export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function parsePagination(query: { page?: string; limit?: string }): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function isValidLanguageCode(code: string): boolean {
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(code);
}
