export interface ObjectBatchStringInput {
  keyPath: string;
  role: string;
  sourceText: string;
  contentType?: string;
}

export function buildObjectBatchPrompts(
  strings: ObjectBatchStringInput[],
  sourceLang: string,
  targetLang: string,
  options?: {
    projectName?: string;
    projectDescription?: string;
    fieldLabel?: string;
    domainHint?: string;
    glossaryHint?: string;
    retryHint?: string;
  },
): { systemPrompt: string; userPrompt: string } {
  const payload = strings.map((item) => ({
    keyPath: item.keyPath,
    role: item.role,
    sourceText: item.sourceText,
    ...(item.contentType ? { contentType: item.contentType } : {}),
  }));

  const systemPrompt = `You are a professional translator. Translate UI copy from ${sourceLang} to ${targetLang}.
Translate the following form field copy as one coherent UI element — keep tone consistent across label, placeholder, and error messages.
Preserve formatting, template placeholders (e.g. {{...}}, %%...%%), and HTML tags exactly as-is.
Return ONLY valid JSON: an array of objects with "keyPath" and "translatedText" for every input string. No markdown fences or commentary.${options?.domainHint ?? ''}${options?.glossaryHint ?? ''}`;

  const parts: string[] = [];
  if (options?.projectName) {
    parts.push(`Project: ${options.projectName}`);
  }
  if (options?.projectDescription?.trim()) {
    parts.push(`Project description: ${options.projectDescription.trim()}`);
  }
  if (options?.fieldLabel?.trim()) {
    parts.push(`Field: ${options.fieldLabel.trim()}`);
  }
  if (options?.retryHint?.trim()) {
    parts.push(`Note: ${options.retryHint.trim()}`);
  }
  parts.push(`Strings (JSON):\n${JSON.stringify(payload, null, 2)}`);

  return { systemPrompt, userPrompt: parts.join('\n\n') };
}

export function parseObjectBatchResponse(
  raw: string,
  expectedKeyPaths: string[],
): Record<string, string> {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Object batch response is not valid JSON');
  }

  const entries: Array<{ keyPath?: string; translatedText?: string }> =
    Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' &&
          parsed !== null &&
          Array.isArray((parsed as { translations?: unknown }).translations)
        ? ((
            parsed as {
              translations: Array<{
                keyPath?: string;
                translatedText?: string;
              }>;
            }
          ).translations ?? [])
        : [];

  if (entries.length === 0) {
    throw new Error('Object batch response missing translation entries');
  }

  const byPath = new Map<string, string>();
  for (const entry of entries) {
    if (!entry.keyPath || typeof entry.translatedText !== 'string') {
      continue;
    }
    byPath.set(entry.keyPath, entry.translatedText);
  }

  const result: Record<string, string> = {};
  for (const keyPath of expectedKeyPaths) {
    const value = byPath.get(keyPath);
    if (!value?.trim()) {
      throw new Error(
        `Object batch response missing translation for ${keyPath}`,
      );
    }
    result[keyPath] = value.trim();
  }

  return result;
}
