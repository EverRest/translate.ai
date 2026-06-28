export type ReferenceTranslationOption = {
  language: string;
  value: string;
};

export function formatReferenceTranslationsPrompt(
  references: ReferenceTranslationOption[],
): string {
  if (references.length === 0) {
    return '';
  }

  const lines = references.map(
    (reference) => `- ${reference.language}: ${reference.value}`,
  );

  return `\nReference translations for the same key (match terminology and tone):\n${lines.join('\n')}`;
}
