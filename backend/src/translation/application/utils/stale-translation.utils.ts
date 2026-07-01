export function normalizeSourceText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function isSourceTextChanged(before: string, after: string): boolean {
  return normalizeSourceText(before) !== normalizeSourceText(after);
}

export function isTranslationStale(
  snapshot: string | null | undefined,
  keySourceText: string,
): boolean {
  if (snapshot == null || snapshot === '') {
    return false;
  }
  return isSourceTextChanged(snapshot, keySourceText);
}
