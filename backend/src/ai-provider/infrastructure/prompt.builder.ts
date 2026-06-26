import {
  GlossaryTermOption,
  TranslateOptions,
} from '../domain/ai-provider.interface';

export interface ProviderUsageMetrics {
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

export interface ProviderTranslateResult {
  text: string;
  usage: ProviderUsageMetrics;
}

export function formatGlossaryPrompt(glossary: GlossaryTermOption[]): string {
  if (glossary.length === 0) {
    return '';
  }

  const lines = glossary.map((term) => {
    if (term.doNotTranslate) {
      return `- Keep "${term.sourceTerm}" unchanged (do not translate).`;
    }
    if (term.targetTerm) {
      return `- Translate "${term.sourceTerm}" as "${term.targetTerm}".`;
    }
    return `- Prefer consistent translation for "${term.sourceTerm}".`;
  });

  return `\nGlossary rules:\n${lines.join('\n')}`;
}

export function buildTranslationPrompts(
  text: string,
  sourceLang: string,
  targetLang: string,
  options?: TranslateOptions,
): { systemPrompt: string; userPrompt: string } {
  const toneHint = options?.tone ? `\nTone: ${options.tone}` : '';
  const contextHint = options?.context ? `\nContext: ${options.context}` : '';
  const contentHint = options?.contentType
    ? `\nContent type: ${options.contentType}`
    : '';
  const glossaryHint = options?.glossary
    ? formatGlossaryPrompt(options.glossary)
    : '';

  const systemPrompt = `You are a professional translator. Translate from ${sourceLang} to ${targetLang}.
Preserve formatting, placeholders like {{name}}, and HTML tags.
Return only the translated text without explanations.${toneHint}${contentHint}${glossaryHint}`;

  const userPrompt = `${contextHint}\n\nText:\n${text}`.trim();

  return { systemPrompt, userPrompt };
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateOpenAiCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const rates: Record<string, { input: number; output: number }> = {
    'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
    'gpt-4o': { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
  };
  const rate = rates[model] ?? rates['gpt-4o-mini'];
  return inputTokens * rate.input + outputTokens * rate.output;
}

export function estimateGeminiCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const rates: Record<string, { input: number; output: number }> = {
    'gemini-2.0-flash': { input: 0.1 / 1_000_000, output: 0.4 / 1_000_000 },
    'gemini-1.5-flash': { input: 0.075 / 1_000_000, output: 0.3 / 1_000_000 },
  };
  const rate = rates[model] ?? rates['gemini-2.0-flash'];
  return inputTokens * rate.input + outputTokens * rate.output;
}
