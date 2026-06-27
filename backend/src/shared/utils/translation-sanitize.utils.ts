import { stripWrappingQuotes } from './string.utils';

const PREFIX_PATTERNS: RegExp[] = [
  /^translation:\s*/i,
  /^output:\s*/i,
  /^result:\s*/i,
  /^here is the translation:\s*/i,
  /^here's the translation:\s*/i,
];

const ZERO_WIDTH_PATTERN = /[\u200B-\u200D\uFEFF]/g;

function sourceHasWrappingQuotes(text: string): boolean {
  const trimmed = text.trim();
  return stripWrappingQuotes(trimmed) !== trimmed;
}

function stripMarkdownFence(text: string): string {
  const match = text.match(/^```[\w-]*\n?([\s\S]*?)```\s*$/);
  if (match) {
    return match[1].trim();
  }
  return text;
}

/** Normalize AI translation output: fences, prefixes, quotes, whitespace. */
export function sanitizeTranslationOutput(
  text: string,
  sourceText?: string,
): string {
  let value = text.replace(/^\uFEFF/, '').trim();
  value = value.replace(ZERO_WIDTH_PATTERN, '');
  value = stripMarkdownFence(value);

  for (const pattern of PREFIX_PATTERNS) {
    value = value.replace(pattern, '').trim();
  }

  const preserveQuotes =
    Boolean(sourceText?.trim()) && sourceHasWrappingQuotes(sourceText!);
  if (!preserveQuotes) {
    value = stripWrappingQuotes(value);
  }

  value = value.replace(/[^\S\n]{2,}/g, ' ');
  value = value.replace(/\n{3,}/g, '\n\n');

  return value.trim();
}
