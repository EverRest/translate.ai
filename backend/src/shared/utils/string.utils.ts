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

const WRAPPING_QUOTE_PAIRS: ReadonlyArray<[string, string]> = [
  ['"', '"'],
  ["'", "'"],
  ['“', '”'],
  ['‘', '’'],
  ['«', '»'],
  ['„', '"'],
  ['`', '`'],
];

/** Remove one matching pair of wrapping quotes from AI output (both sides). */
export function stripWrappingQuotes(text: string): string {
  let value = text.trim();

  for (let pass = 0; pass < 3; pass += 1) {
    if (value.length < 2) {
      break;
    }

    let stripped = false;
    for (const [open, close] of WRAPPING_QUOTE_PAIRS) {
      if (value.startsWith(open) && value.endsWith(close)) {
        value = value.slice(open.length, value.length - close.length).trim();
        stripped = true;
        break;
      }
    }

    if (!stripped) {
      break;
    }
  }

  return value;
}
