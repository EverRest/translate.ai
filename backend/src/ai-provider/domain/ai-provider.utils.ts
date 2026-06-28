import { SupportedProvider, SUPPORTED_PROVIDERS } from './ai-provider.types';

const PSEUDO_PROVIDERS = new Set(['memory', 'mock']);

export function isSupportedAiProvider(
  value: string,
): value is SupportedProvider {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(value);
}

/** Maps job/API provider names to a real AI backend (ignores memory/mock). */
export function resolveJobAiProvider(
  provider: string | null | undefined,
  fallback = 'gemini',
): SupportedProvider {
  const normalized = provider?.trim().toLowerCase();
  if (normalized && isSupportedAiProvider(normalized)) {
    return normalized;
  }

  const fallbackNormalized = fallback.trim().toLowerCase();
  if (isSupportedAiProvider(fallbackNormalized)) {
    return fallbackNormalized;
  }

  return 'gemini';
}

/** Provider stored on translations; memory/mock inherit the job's AI provider. */
export function resolveStoredTranslationProvider(
  resultProvider: string,
  jobProvider: string | null | undefined,
): SupportedProvider {
  const normalized = resultProvider.trim().toLowerCase();
  if (!PSEUDO_PROVIDERS.has(normalized) && isSupportedAiProvider(normalized)) {
    return normalized;
  }

  return resolveJobAiProvider(jobProvider);
}

export function isPseudoProvider(provider: string | null | undefined): boolean {
  const normalized = provider?.trim().toLowerCase();
  return normalized ? PSEUDO_PROVIDERS.has(normalized) : false;
}
