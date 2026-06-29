export type DriftVariant = {
  value: string;
  count: number;
  keyIds: string[];
};

export type DriftIssueCandidate = {
  sourceTerm: string;
  language: string;
  variants: DriftVariant[];
  severity: 'low' | 'medium' | 'high';
};

export type DriftCorpusRow = {
  keyId: string;
  key: string;
  sourceText: string;
  language: string;
  value: string;
};

/** Extract terminology tokens from a translation key path and source text. */
export function extractSourceTokens(key: string, sourceText: string): string[] {
  const tokens = new Set<string>();
  const suffixMatch = key.match(/: ([^:]+)$/);
  if (suffixMatch?.[1]) {
    tokens.add(suffixMatch[1].trim());
  }

  const trimmedSource = sourceText.trim();
  if (trimmedSource.length >= 2 && trimmedSource.length <= 80) {
    tokens.add(trimmedSource);
  }

  const lastSegment = key.split('.').pop()?.split(':').pop()?.trim();
  if (lastSegment && lastSegment.length >= 2 && lastSegment.length <= 80) {
    tokens.add(lastSegment);
  }

  return [...tokens];
}

export function detectTerminologyDrift(
  rows: DriftCorpusRow[],
  options?: { minVariants?: number; minKeysPerVariant?: number },
): DriftIssueCandidate[] {
  const minVariants = options?.minVariants ?? 2;
  const minKeysPerVariant = options?.minKeysPerVariant ?? 1;

  const buckets = new Map<
    string,
    Map<string, Map<string, { count: number; keyIds: Set<string> }>>
  >();

  for (const row of rows) {
    const value = row.value.trim();
    if (!value) {
      continue;
    }

    for (const token of extractSourceTokens(row.key, row.sourceText)) {
      const bucketKey = `${token.toLowerCase()}::${row.language}`;
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, new Map());
      }
      const languageBucket = buckets.get(bucketKey)!;
      const tokenKey = token;
      if (!languageBucket.has(tokenKey)) {
        languageBucket.set(tokenKey, new Map());
      }
      const variants = languageBucket.get(tokenKey)!;
      const normalizedValue = value;
      if (!variants.has(normalizedValue)) {
        variants.set(normalizedValue, { count: 0, keyIds: new Set() });
      }
      const entry = variants.get(normalizedValue)!;
      entry.count += 1;
      entry.keyIds.add(row.keyId);
    }
  }

  const issues: DriftIssueCandidate[] = [];

  for (const [bucketKey, tokenMap] of buckets) {
    const language = bucketKey.split('::')[1] ?? '';
    for (const [sourceTerm, variantsMap] of tokenMap) {
      const variants: DriftVariant[] = [...variantsMap.entries()]
        .filter(([, meta]) => meta.count >= minKeysPerVariant)
        .map(([value, meta]) => ({
          value,
          count: meta.count,
          keyIds: [...meta.keyIds],
        }))
        .sort((left, right) => right.count - left.count);

      if (variants.length < minVariants) {
        continue;
      }

      const total = variants.reduce((sum, variant) => sum + variant.count, 0);
      const topShare = variants[0]?.count ?? 0;
      const imbalance = topShare / total;
      const severity =
        imbalance >= 0.7 ? 'low' : imbalance >= 0.5 ? 'medium' : 'high';

      issues.push({ sourceTerm, language, variants, severity });
    }
  }

  return issues.sort((left, right) => {
    const severityRank = { high: 3, medium: 2, low: 1 };
    return severityRank[right.severity] - severityRank[left.severity];
  });
}
