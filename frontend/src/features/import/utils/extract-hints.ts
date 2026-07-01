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
