export type TranslationCorpusRow = {
  key: string;
  sourceText: string;
  translations: Array<{ language: string; value: string }>;
};

export type SuggestionCandidate = {
  sourceTerm: string;
  targetTerm?: string | null;
  doNotTranslate: boolean;
  confidence: number;
  reason: string;
};

const PRODUCT_CODE_PATTERN = /\b[A-Z]{2,}[A-Z0-9_-]{0,}\b/g;
const PASCAL_CASE_PATTERN = /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g;
const ALL_CAPS_PATTERN = /\b[A-Z]{2,}\b/g;

export function mineGlossarySuggestions(
  rows: TranslationCorpusRow[],
): SuggestionCandidate[] {
  const candidates: SuggestionCandidate[] = [];

  candidates.push(...mineIdenticalToSource(rows));
  candidates.push(...mineStablePreferredPairs(rows));
  candidates.push(...mineProductCodes(rows));
  candidates.push(...mineCapitalizedTokens(rows));

  return candidates;
}

export function mergeSuggestionCandidates(
  candidates: SuggestionCandidate[],
  existingSourceTerms: Iterable<string>,
): SuggestionCandidate[] {
  const existing = new Set(
    [...existingSourceTerms].map((term) => normalizeTermKey(term)),
  );
  const merged = new Map<string, SuggestionCandidate>();

  for (const candidate of candidates) {
    const key = normalizeTermKey(candidate.sourceTerm);
    if (existing.has(key) || candidate.sourceTerm.trim().length < 2) {
      continue;
    }

    const current = merged.get(key);
    if (!current || candidate.confidence > current.confidence) {
      merged.set(key, candidate);
    }
  }

  return [...merged.values()].sort((left, right) => {
    if (right.confidence !== left.confidence) {
      return right.confidence - left.confidence;
    }
    return left.sourceTerm.localeCompare(right.sourceTerm);
  });
}

function mineIdenticalToSource(
  rows: TranslationCorpusRow[],
): SuggestionCandidate[] {
  const results: SuggestionCandidate[] = [];

  for (const row of rows) {
    const source = row.sourceText.trim();
    if (source.length < 2) {
      continue;
    }

    const identicalCount = row.translations.filter(
      (translation) =>
        translation.value.trim().toLowerCase() === source.toLowerCase(),
    ).length;

    if (identicalCount >= 2) {
      results.push({
        sourceTerm: source,
        targetTerm: null,
        doNotTranslate: true,
        confidence: Math.min(0.95, 0.7 + identicalCount * 0.05),
        reason: 'identical_across_languages',
      });
    }
  }

  return results;
}

function mineStablePreferredPairs(
  rows: TranslationCorpusRow[],
): SuggestionCandidate[] {
  const results: SuggestionCandidate[] = [];

  for (const row of rows) {
    const source = row.sourceText.trim();
    if (source.length < 2) {
      continue;
    }

    const byLanguage = new Map<string, string>();
    for (const translation of row.translations) {
      const value = translation.value.trim();
      if (!value || value.toLowerCase() === source.toLowerCase()) {
        continue;
      }
      byLanguage.set(translation.language, value);
    }

    for (const [language, value] of byLanguage) {
      results.push({
        sourceTerm: source,
        targetTerm: value,
        doNotTranslate: false,
        confidence: 0.75,
        reason: `stable_pair_${language}`,
      });
    }
  }

  return results;
}

function mineProductCodes(rows: TranslationCorpusRow[]): SuggestionCandidate[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const haystack = [
      row.sourceText,
      ...row.translations.map((t) => t.value),
    ].join(' ');
    for (const match of haystack.match(PRODUCT_CODE_PATTERN) ?? []) {
      if (match.length < 3 || isCommonWord(match)) {
        continue;
      }
      counts.set(match, (counts.get(match) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([term, count]) => ({
      sourceTerm: term,
      targetTerm: null,
      doNotTranslate: true,
      confidence: Math.min(0.9, 0.55 + count * 0.05),
      reason: 'product_code',
    }));
}

function mineCapitalizedTokens(
  rows: TranslationCorpusRow[],
): SuggestionCandidate[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const tokens = [
      ...(row.sourceText.match(PASCAL_CASE_PATTERN) ?? []),
      ...(row.sourceText.match(ALL_CAPS_PATTERN) ?? []),
    ];
    for (const token of tokens) {
      if (token.length < 3 || isCommonWord(token)) {
        continue;
      }
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 3)
    .map(([term, count]) => ({
      sourceTerm: term,
      targetTerm: null,
      doNotTranslate: true,
      confidence: Math.min(0.85, 0.5 + count * 0.04),
      reason: 'capitalized_token',
    }));
}

function normalizeTermKey(term: string): string {
  return term.trim().toLowerCase();
}

function isCommonWord(token: string): boolean {
  return ['THE', 'AND', 'FOR', 'API', 'URL', 'ID'].includes(
    token.toUpperCase(),
  );
}
