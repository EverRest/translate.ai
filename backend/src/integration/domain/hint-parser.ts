const PLACEHOLDER_PATTERN = /%%[^%]+%%/;

export function buildKeyContext(scope?: string, hints?: string): string | null {
  const lines: string[] = [];
  const trimmedScope = scope?.trim();
  const trimmedHints = hints?.trim();

  if (trimmedScope) {
    lines.push(`scope: ${trimmedScope}`);
  }
  if (trimmedHints) {
    lines.push(`hints: ${trimmedHints}`);
    if (PLACEHOLDER_PATTERN.test(trimmedHints)) {
      lines.push('strictPlaceholders: true');
    }
  }

  return lines.length > 0 ? lines.join('\n') : null;
}

export function extractHintsFromContext(
  context: string | null | undefined,
): string | null {
  if (!context) return null;
  const match = context.match(/^hints:\s*(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

export function extractScopeFromContext(
  context: string | null | undefined,
): string | null {
  if (!context) return null;
  const match = context.match(/^scope:\s*(.+)$/m);
  return match?.[1]?.trim() ?? null;
}
