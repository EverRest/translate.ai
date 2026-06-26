import { ContentType, TranslateOptions } from '../domain/ai-provider.interface';

const CONTENT_TYPES: ContentType[] = [
  'ui',
  'email',
  'legal',
  'marketing',
  'article',
  'chat',
  'technical',
  'general',
];

const KEYWORD_MAP: Array<{ keywords: string[]; type: ContentType }> = [
  { keywords: ['legal', 'contract', 'terms', 'compliance'], type: 'legal' },
  { keywords: ['marketing', 'campaign', 'promo', 'advert'], type: 'marketing' },
  { keywords: ['email', 'newsletter', 'subject line'], type: 'email' },
  { keywords: ['article', 'blog', 'post', 'content'], type: 'article' },
  {
    keywords: ['ui', 'button', 'label', 'form', 'tooltip', 'menu'],
    type: 'ui',
  },
  { keywords: ['chat', 'message', 'conversation'], type: 'chat' },
  {
    keywords: ['technical', 'manual', 'spec', 'documentation'],
    type: 'technical',
  },
];

export function inferContentTypeFromContext(
  context?: string,
): ContentType | undefined {
  if (!context) {
    return undefined;
  }

  const normalized = context.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.type;
    }
  }

  return undefined;
}

export function inferContentTypeFromOptions(
  text: string,
  options?: TranslateOptions,
): ContentType {
  if (options?.contentType) {
    return options.contentType;
  }

  const fromContext = inferContentTypeFromContext(options?.context);
  if (fromContext) {
    return fromContext;
  }

  if (options?.tone === 'technical') {
    return 'technical';
  }

  if (text.length < 200) {
    return 'chat';
  }

  return 'general';
}

export function parseClassifierLabel(raw: string): ContentType | undefined {
  const label = raw
    .trim()
    .toLowerCase()
    .split(/\s+/)[0]
    ?.replace(/[^a-z]/g, '');
  if (label && CONTENT_TYPES.includes(label as ContentType)) {
    return label as ContentType;
  }
  return undefined;
}

export function buildClassifierPrompt(text: string, context?: string): string {
  const contextHint = context ? `\nContext: ${context}` : '';
  return `Classify the following text for translation routing.

Return only one label: ui, email, legal, marketing, article, chat, technical, general
${contextHint}

Text:
${text.slice(0, 1500)}`;
}
