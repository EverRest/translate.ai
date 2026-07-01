const DOUBLE_BRACE_PATTERN = /\{\{[^{}]+\}\}/g;
const PERCENT_TOKEN_PATTERN = /%%[^%]+%%/g;

export function extractPlaceholders(text: string): string[] {
  return [
    ...(text.match(DOUBLE_BRACE_PATTERN) ?? []),
    ...(text.match(PERCENT_TOKEN_PATTERN) ?? []),
  ];
}

export function countPlaceholders(text: string): number {
  return extractPlaceholders(text).length;
}
