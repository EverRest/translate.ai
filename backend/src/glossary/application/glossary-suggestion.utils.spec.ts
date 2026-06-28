import {
  mergeSuggestionCandidates,
  mineGlossarySuggestions,
  type SuggestionCandidate,
  type TranslationCorpusRow,
} from './glossary-suggestion.utils';

describe('glossary-suggestion.utils', () => {
  const rows: TranslationCorpusRow[] = [
    {
      key: 'brand',
      sourceText: 'Translate.ai',
      translations: [
        { language: 'de', value: 'Translate.ai' },
        { language: 'fr', value: 'Translate.ai' },
      ],
    },
    {
      key: 'checkout',
      sourceText: 'Checkout',
      translations: [
        { language: 'de', value: 'Zur Kasse' },
        { language: 'fr', value: 'Payer' },
      ],
    },
    {
      key: 'sku',
      sourceText: 'Use SKU-42 today',
      translations: [
        { language: 'de', value: 'Nutzen Sie SKU-42 heute' },
        { language: 'fr', value: 'Utilisez SKU-42 aujourd’hui' },
      ],
    },
  ];

  it('merges duplicate candidates and ranks by confidence', () => {
    const mined = mineGlossarySuggestions(rows);
    const merged = mergeSuggestionCandidates(mined, new Set(['Checkout']));

    expect(merged.some((item) => item.sourceTerm === 'Checkout')).toBe(false);
    expect(merged[0]?.confidence).toBeGreaterThanOrEqual(
      merged[1]?.confidence ?? 0,
    );
  });

  it('detects identical brand terms as do-not-translate', () => {
    const merged = mergeSuggestionCandidates(
      mineGlossarySuggestions(rows),
      new Set(),
    );

    const brand = merged.find((item) => item.sourceTerm === 'Translate.ai');
    expect(brand?.doNotTranslate).toBe(true);
    expect(brand?.reason).toBe('identical_across_languages');
  });

  it('detects stable preferred translation pairs', () => {
    const merged = mergeSuggestionCandidates(
      mineGlossarySuggestions(rows),
      new Set(),
    );

    const checkoutDe = merged.find(
      (item) =>
        item.sourceTerm === 'Checkout' && item.targetTerm === 'Zur Kasse',
    );
    expect(checkoutDe?.doNotTranslate).toBe(false);
  });

  it('promotes higher-confidence duplicate source terms once', () => {
    const candidates: SuggestionCandidate[] = [
      {
        sourceTerm: 'SKU-42',
        doNotTranslate: true,
        confidence: 0.7,
        reason: 'product_code',
      },
      {
        sourceTerm: 'SKU-42',
        doNotTranslate: true,
        confidence: 0.85,
        reason: 'product_code',
      },
    ];

    const merged = mergeSuggestionCandidates(candidates, new Set());
    expect(merged).toHaveLength(1);
    expect(merged[0]?.confidence).toBe(0.85);
  });
});
