export function resolveOpenAiModelChain(
  primary: string,
  fallback?: string | null,
): string[] {
  const normalizedPrimary = primary.trim();
  if (!normalizedPrimary) {
    return [];
  }

  const normalizedFallback = fallback?.trim();
  if (
    !normalizedFallback ||
    normalizedFallback.toLowerCase() === normalizedPrimary.toLowerCase()
  ) {
    return [normalizedPrimary];
  }

  return [normalizedPrimary, normalizedFallback];
}
