import { TranslationStatus } from '@prisma/client';
import {
  MAX_REFERENCE_TRANSLATIONS,
  MAX_REFERENCE_VALUE_LENGTH,
  selectReferenceTranslations,
  shouldIncludeReferenceTranslations,
  truncateReferenceValue,
} from './reference-translation.utils';
import { formatReferenceTranslationsPrompt } from '../../../shared/utils/reference-translation-prompt.utils';

describe('reference-translation.utils', () => {
  const rows = [
    {
      language: 'es',
      value: 'Turbo ES',
      status: TranslationStatus.draft,
    },
    {
      language: 'de',
      value: 'Turbo DE',
      status: TranslationStatus.published,
    },
    {
      language: 'fr',
      value: 'Turbo FR',
      status: TranslationStatus.approved,
    },
    {
      language: 'ua',
      value: '   ',
      status: TranslationStatus.draft,
    },
  ];

  it('excludes target language and empty values', () => {
    expect(selectReferenceTranslations(rows, 'es')).toEqual([
      { language: 'de', value: 'Turbo DE' },
      { language: 'fr', value: 'Turbo FR' },
    ]);
  });

  it('sorts by status priority then language', () => {
    const mixed = [
      {
        language: 'it',
        value: 'B',
        status: TranslationStatus.draft,
      },
      {
        language: 'de',
        value: 'A',
        status: TranslationStatus.published,
      },
      {
        language: 'fr',
        value: 'C',
        status: TranslationStatus.review,
      },
    ];

    expect(
      selectReferenceTranslations(mixed, 'en').map((r) => r.language),
    ).toEqual(['de', 'fr', 'it']);
  });

  it('caps the number of references', () => {
    const many = Array.from({ length: 10 }, (_, index) => ({
      language: `l${index}`,
      value: `v${index}`,
      status: TranslationStatus.draft,
    }));

    expect(selectReferenceTranslations(many, 'en', 8)).toHaveLength(8);
  });

  it('truncates long reference values', () => {
    const long = 'x'.repeat(MAX_REFERENCE_VALUE_LENGTH + 10);
    expect(truncateReferenceValue(long)).toHaveLength(
      MAX_REFERENCE_VALUE_LENGTH,
    );
    expect(truncateReferenceValue(long).endsWith('…')).toBe(true);
  });

  it('formats reference prompt block', () => {
    const prompt = formatReferenceTranslationsPrompt([
      { language: 'de', value: 'Turbo' },
    ]);

    expect(prompt).toContain('Reference translations for the same key');
    expect(prompt).toContain('- de: Turbo');
  });

  it('returns empty prompt for no references', () => {
    expect(formatReferenceTranslationsPrompt([])).toBe('');
  });

  it('includes references on retry attempt or manual retry payload', () => {
    expect(shouldIncludeReferenceTranslations(1, false, 2)).toBe(false);
    expect(shouldIncludeReferenceTranslations(2, false, 2)).toBe(true);
    expect(shouldIncludeReferenceTranslations(1, true, 2)).toBe(true);
    expect(shouldIncludeReferenceTranslations(2, false, 0)).toBe(false);
  });

  it('exports stable limits', () => {
    expect(MAX_REFERENCE_TRANSLATIONS).toBe(8);
    expect(MAX_REFERENCE_VALUE_LENGTH).toBe(300);
  });
});
