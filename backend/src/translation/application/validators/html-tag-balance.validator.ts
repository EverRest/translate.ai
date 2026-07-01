import type { QaValidationResult } from './qa-validation.types';

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

const TAG_PATTERN = /<\/?([a-zA-Z][\w:-]*)\b[^>]*\/?>/g;

function hasHtmlTags(text: string): boolean {
  TAG_PATTERN.lastIndex = 0;
  return TAG_PATTERN.test(text);
}

function isSelfClosingTag(tagText: string): boolean {
  return /\/>\s*$/.test(tagText);
}

export function validateHtmlTagBalance(
  sourceText: string,
  outputText: string,
): QaValidationResult {
  if (!hasHtmlTags(sourceText)) {
    return { valid: true, validator: 'HtmlTagBalanceValidator' };
  }

  const stack: string[] = [];
  TAG_PATTERN.lastIndex = 0;

  for (const match of outputText.matchAll(TAG_PATTERN)) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();

    if (fullTag.startsWith('</')) {
      const expected = stack.pop();
      if (!expected) {
        return {
          valid: false,
          validator: 'HtmlTagBalanceValidator',
          reason: `HtmlTagBalanceValidator: unexpected closing tag </${tagName}>`,
        };
      }

      if (expected !== tagName) {
        return {
          valid: false,
          validator: 'HtmlTagBalanceValidator',
          reason: `HtmlTagBalanceValidator: expected </${expected}>, got </${tagName}>`,
        };
      }
      continue;
    }

    if (VOID_TAGS.has(tagName) || isSelfClosingTag(fullTag)) {
      continue;
    }

    stack.push(tagName);
  }

  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    return {
      valid: false,
      validator: 'HtmlTagBalanceValidator',
      reason: `HtmlTagBalanceValidator: unclosed tag <${unclosed}>`,
    };
  }

  return { valid: true, validator: 'HtmlTagBalanceValidator' };
}
