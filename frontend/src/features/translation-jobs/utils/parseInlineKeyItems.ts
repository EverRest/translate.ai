export type JobKeyItem = {
  key: string;
  sourceText: string;
  description?: string;
  context?: string;
};

/** One key per line: `key | source text` or JSON array of { key, sourceText }. */
export function parseInlineKeyItems(input: string): JobKeyItem[] {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('JSON must be an array of { key, sourceText } objects.');
    }
    return parsed.map((item, index) => {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof (item as JobKeyItem).key !== 'string' ||
        typeof (item as JobKeyItem).sourceText !== 'string'
      ) {
        throw new Error(`Invalid key item at index ${index}.`);
      }
      const row = item as JobKeyItem;
      return {
        key: row.key.trim(),
        sourceText: row.sourceText.trim(),
        description: row.description?.trim(),
        context: row.context?.trim(),
      };
    });
  }

  return trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const separator = line.includes('|') ? '|' : '\t';
      const parts = line.split(separator);
      if (parts.length < 2) {
        throw new Error(
          `Line ${index + 1}: use "key | source text" or paste JSON.`,
        );
      }
      const key = parts[0]?.trim() ?? '';
      const sourceText = parts.slice(1).join(separator).trim();
      if (!key || !sourceText) {
        throw new Error(`Line ${index + 1}: key and source text are required.`);
      }
      return { key, sourceText };
    });
}
