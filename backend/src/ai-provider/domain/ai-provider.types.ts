export const SUPPORTED_PROVIDERS = ['openai', 'gemini', 'ollama'] as const;
export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

export interface TranslateContext {
  tenantId: string;
  userId?: string;
  projectId?: string;
  jobId?: string;
  jobItemId?: string;
}

export interface TranslateWithFallbackResult {
  text: string;
  provider: string;
  usedFallback: boolean;
  primaryProvider: string;
}
