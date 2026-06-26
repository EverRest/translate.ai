import {
  inferContentTypeFromContext,
  inferContentTypeFromOptions,
  parseClassifierLabel,
} from './content-classifier.utils';

describe('content-classifier.utils', () => {
  describe('inferContentTypeFromContext', () => {
    it('detects legal keywords', () => {
      expect(inferContentTypeFromContext('Legal terms and compliance')).toBe(
        'legal',
      );
    });

    it('detects ui keywords', () => {
      expect(inferContentTypeFromContext('Button label for checkout')).toBe(
        'ui',
      );
    });
  });

  describe('inferContentTypeFromOptions', () => {
    it('prefers explicit contentType', () => {
      expect(
        inferContentTypeFromOptions('long text...', { contentType: 'email' }),
      ).toBe('email');
    });

    it('uses technical tone', () => {
      expect(
        inferContentTypeFromOptions('long text here', { tone: 'technical' }),
      ).toBe('technical');
    });

    it('uses short text heuristic', () => {
      expect(inferContentTypeFromOptions('Hi', undefined)).toBe('chat');
    });
  });

  describe('parseClassifierLabel', () => {
    it('parses valid label', () => {
      expect(parseClassifierLabel('marketing')).toBe('marketing');
    });

    it('rejects invalid label', () => {
      expect(parseClassifierLabel('unknown-type')).toBeUndefined();
    });
  });
});
