import {
  detectTerminologyDrift,
  extractSourceTokens,
} from './terminology-drift.utils';

describe('terminology-drift.utils', () => {
  describe('extractSourceTokens', () => {
    it('extracts suffix token from colon key paths', () => {
      expect(
        extractSourceTokens('registration_form: Title', 'Create account'),
      ).toContain('Title');
    });
  });

  describe('detectTerminologyDrift', () => {
    it('finds Title with two RU variants', () => {
      const issues = detectTerminologyDrift([
        {
          keyId: 'k1',
          key: 'form_a: Title',
          sourceText: 'Title',
          language: 'ru',
          value: 'Заголовок',
        },
        {
          keyId: 'k2',
          key: 'form_b: Title',
          sourceText: 'Title',
          language: 'ru',
          value: 'Название',
        },
        {
          keyId: 'k3',
          key: 'form_c: Title',
          sourceText: 'Title',
          language: 'ru',
          value: 'Заголовок',
        },
      ]);

      expect(issues).toHaveLength(1);
      expect(issues[0]?.sourceTerm).toBe('Title');
      expect(issues[0]?.language).toBe('ru');
      expect(issues[0]?.variants).toHaveLength(2);
    });
  });
});
