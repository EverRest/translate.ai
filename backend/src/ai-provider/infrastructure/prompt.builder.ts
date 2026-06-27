import {
  ContentType,
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

const CONTENT_TYPE_HINTS: Partial<Record<ContentType, string>> = {
  ui: 'Short form field label or button. Use short, modern, commonly used terms as seen in web forms and apps. Avoid archaic or overly formal expressions.',
  placeholder: 'Input placeholder or hint text. Very short, no full sentence.',
  email: 'Email copy. Match subject/body tone.',
  article: 'Long-form content. Preserve paragraph structure.',
  legal: 'Legal text. Preserve precise meaning and formal tone.',
  marketing: 'Marketing copy. Keep persuasive tone.',
  chat: 'Conversational message. Natural phrasing.',
  technical: 'Technical documentation. Use precise terminology.',
};

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

function buildContentHint(contentType: ContentType): string {
  if (contentType === 'ui') {
    return '\nContent type: ui — short form field label or button. Use short, modern, commonly used terms as seen in web forms and apps. Avoid archaic or overly formal expressions.';
  }
  return `\nContent type: ${contentType}`;
}

function buildUserPromptParts(
  text: string,
  options?: TranslateOptions,
): string {
  const parts: string[] = [];

  if (options?.projectName) {
    parts.push(`Project: ${options.projectName}`);
  }

  if (options?.projectDescription?.trim()) {
    parts.push(`Project description: ${options.projectDescription.trim()}`);
  }

  if (options?.keyDescription?.trim()) {
    parts.push(`Description: ${options.keyDescription.trim()}`);
  }

  if (options?.context?.trim()) {
    parts.push(`Context: ${options.context.trim()}`);
  }

  if (options?.retryHint?.trim()) {
    parts.push(`Note: ${options.retryHint.trim()}`);
  }

  parts.push(`Text:\n${text}`);

  return parts.join('\n\n');
}

export function buildTranslationPrompts(
  text: string,
  sourceLang: string,
  targetLang: string,
  options?: TranslateOptions,
): { systemPrompt: string; userPrompt: string } {
  const toneHint = options?.tone ? `\nTone: ${options.tone}` : '';
  const contentHint = options?.contentType
    ? buildContentHint(options.contentType)
    : '';
  const contentTypeGuidance =
    options?.contentType &&
    options.contentType !== 'ui' &&
    CONTENT_TYPE_HINTS[options.contentType]
      ? `\n${CONTENT_TYPE_HINTS[options.contentType]}`
      : '';
  const glossaryHint = options?.glossary
    ? formatGlossaryPrompt(options.glossary)
    : '';

  const systemPrompt = `You are a professional translator. Translate from ${sourceLang} to ${targetLang}.
Preserve formatting, template placeholders (e.g. {{...}}, %%...%%), and HTML tags exactly as-is — do not translate or alter them.
Return only the translated text without explanations or surrounding quotation marks.${toneHint}${contentHint}${contentTypeGuidance}${glossaryHint}`;

  const userPrompt = buildUserPromptParts(text, options);

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
