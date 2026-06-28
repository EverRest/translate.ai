import type { QaValidationResult } from './qa-validation.types';

const DOUBLE_BRACE_PATTERN = /\{\{[^{}]+\}\}/g;
const PERCENT_TOKEN_PATTERN = /%%[^%]+%%/g;

function extractPlaceholders(text: string): string[] {
  return [
    ...(text.match(DOUBLE_BRACE_PATTERN) ?? []),
    ...(text.match(PERCENT_TOKEN_PATTERN) ?? []),
  ];
}

function countOccurrences(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

export function validatePlaceholders(
  sourceText: string,
  outputText: string,
): QaValidationResult {
  const sourcePlaceholders = extractPlaceholders(sourceText);
  const outputPlaceholders = extractPlaceholders(outputText);

  if (sourcePlaceholders.length === 0) {
    if (outputPlaceholders.length === 0) {
      return { valid: true, validator: 'PlaceholderValidator' };
    }

    return {
      valid: false,
      validator: 'PlaceholderValidator',
      reason: `PlaceholderValidator: unexpected placeholder ${outputPlaceholders[0]}`,
    };
  }

  const sourceCounts = countOccurrences(sourcePlaceholders);
  const outputCounts = countOccurrences(outputPlaceholders);

  for (const [placeholder, expectedCount] of sourceCounts) {
    const actualCount = outputCounts.get(placeholder) ?? 0;
    if (actualCount !== expectedCount) {
      if (actualCount === 0) {
        return {
          valid: false,
          validator: 'PlaceholderValidator',
          reason: `PlaceholderValidator: missing placeholder ${placeholder}`,
        };
      }

      return {
        valid: false,
        validator: 'PlaceholderValidator',
        reason: `PlaceholderValidator: expected ${expectedCount}× ${placeholder}, got ${actualCount}`,
      };
    }
  }

  for (const placeholder of outputCounts.keys()) {
    if (!sourceCounts.has(placeholder)) {
      return {
        valid: false,
        validator: 'PlaceholderValidator',
        reason: `PlaceholderValidator: unexpected placeholder ${placeholder}`,
      };
    }
  }

  return { valid: true, validator: 'PlaceholderValidator' };
}
