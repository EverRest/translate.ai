export type TerminologyCorpusRow = {
  keyId: string;
  key: string;
  sourceText: string;
  translations: Array<{ language: string; value: string }>;
};

export type DriftVariant = {
  translation: string;
  keyIds: string[];
  keys: string[];
};

export type DetectedDriftIssue = {
  sourceTerm: string;
  targetLang: string;
  variants: DriftVariant[];
};

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'as',
  'is',
  'was',
  'are',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'must',
  'shall',
  'can',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'your',
  'you',
  'our',
]);

export function detectTerminologyDrift(
  rows: TerminologyCorpusRow[],
  sourceLanguage = 'en',
): DetectedDriftIssue[] {
  const issues: DetectedDriftIssue[] = [];
  const seen = new Set<string>();

  const bySource = new Map<string, TerminologyCorpusRow[]>();
  for (const row of rows) {
    const normalized = row.sourceText.trim().toLowerCase();
    if (!normalized) {
      continue;
    }
    const group = bySource.get(normalized) ?? [];
    group.push(row);
    bySource.set(normalized, group);
  }

  for (const group of bySource.values()) {
    if (group.length < 2) {
      continue;
    }
    const sourceTerm = group[0].sourceText.trim();
    appendIssuesForGroup(group, sourceTerm, sourceLanguage, issues, seen);
  }

  const termToRows = new Map<string, TerminologyCorpusRow[]>();
  for (const row of rows) {
    for (const term of extractSourceTerms(row.sourceText)) {
      const normalized = term.toLowerCase();
      const list = termToRows.get(normalized) ?? [];
      if (!list.some((entry) => entry.keyId === row.keyId)) {
        list.push(row);
      }
      termToRows.set(normalized, list);
    }
  }

  for (const [normalizedTerm, group] of termToRows) {
    if (group.length < 2) {
      continue;
    }

    const exactRows = group.filter(
      (row) => row.sourceText.trim().toLowerCase() === normalizedTerm,
    );
    if (exactRows.length < 2) {
      continue;
    }

    const displayTerm =
      exactRows[0].sourceText.trim() ||
      group
        .find((row) =>
          extractSourceTerms(row.sourceText).some(
            (term) => term.toLowerCase() === normalizedTerm,
          ),
        )
        ?.sourceText.trim() ||
      normalizedTerm;

    appendIssuesForGroup(exactRows, displayTerm, sourceLanguage, issues, seen);
  }

  return issues;
}

function appendIssuesForGroup(
  group: TerminologyCorpusRow[],
  sourceTerm: string,
  sourceLanguage: string,
  issues: DetectedDriftIssue[],
  seen: Set<string>,
) {
  const languages = new Set<string>();
  for (const row of group) {
    for (const translation of row.translations) {
      if (translation.language !== sourceLanguage && translation.value.trim()) {
        languages.add(translation.language);
      }
    }
  }

  for (const targetLang of languages) {
    const variantMap = new Map<
      string,
      { translation: string; keyIds: string[]; keys: string[] }
    >();

    for (const row of group) {
      const match = row.translations.find(
        (translation) => translation.language === targetLang,
      );
      if (!match?.value.trim()) {
        continue;
      }

      const normalized = normalizeTranslation(match.value);
      const current = variantMap.get(normalized) ?? {
        translation: match.value.trim(),
        keyIds: [],
        keys: [],
      };
      if (!current.keyIds.includes(row.keyId)) {
        current.keyIds.push(row.keyId);
        current.keys.push(row.key);
      }
      variantMap.set(normalized, current);
    }

    if (variantMap.size < 2) {
      continue;
    }

    const dedupeKey = `${sourceTerm.toLowerCase()}::${targetLang}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    issues.push({
      sourceTerm,
      targetLang,
      variants: [...variantMap.values()].sort((left, right) =>
        left.translation.localeCompare(right.translation),
      ),
    });
  }
}

export function extractSourceTerms(sourceText: string): string[] {
  const trimmed = sourceText.trim();
  if (!trimmed) {
    return [];
  }

  const terms = new Set<string>();
  const matches = trimmed.match(/\b[A-Za-z][A-Za-z'-]{2,}\b/g) ?? [];
  for (const match of matches) {
    if (!STOP_WORDS.has(match.toLowerCase())) {
      terms.add(match);
    }
  }

  return [...terms];
}

function normalizeTranslation(value: string): string {
  return value.trim().toLowerCase();
}
