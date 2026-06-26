import {
  buildTranslationPrompts,
  estimateGeminiCost,
  estimateOpenAiCost,
  estimateTokens,
  formatGlossaryPrompt,
} from './prompt.builder';

describe('prompt.builder', () => {
  describe('buildTranslationPrompts', () => {
    it('includes tone and context in prompts', () => {
      const { systemPrompt, userPrompt } = buildTranslationPrompts(
        'Hello',
        'en',
        'de',
        { tone: 'formal', context: 'Checkout button' },
      );

      expect(systemPrompt).toContain('en');
      expect(systemPrompt).toContain('de');
      expect(systemPrompt).toContain('Tone: formal');
      expect(userPrompt).toContain('Checkout button');
      expect(userPrompt).toContain('Hello');
    });

    it('includes content type in system prompt', () => {
      const { systemPrompt } = buildTranslationPrompts('Hello', 'en', 'de', {
        contentType: 'marketing',
      });

      expect(systemPrompt).toContain('Content type: marketing');
    });

    it('includes glossary rules in system prompt', () => {
      const { systemPrompt } = buildTranslationPrompts('Hello', 'en', 'de', {
        glossary: [
          { sourceTerm: 'Checkout', targetTerm: null, doNotTranslate: true },
          {
            sourceTerm: 'Cart',
            targetTerm: 'Warenkorb',
            doNotTranslate: false,
          },
        ],
      });

      expect(systemPrompt).toContain('Keep "Checkout" unchanged');
      expect(systemPrompt).toContain('Translate "Cart" as "Warenkorb"');
    });
  });

  describe('formatGlossaryPrompt', () => {
    it('returns empty string for no terms', () => {
      expect(formatGlossaryPrompt([])).toBe('');
    });
  });

  describe('estimateTokens', () => {
    it('returns at least 1 token for non-empty text', () => {
      expect(estimateTokens('a')).toBe(1);
      expect(estimateTokens('hello world')).toBeGreaterThan(1);
    });
  });

  describe('cost estimates', () => {
    it('computes OpenAI cost from token counts', () => {
      const cost = estimateOpenAiCost('gpt-4o-mini', 1000, 500);
      expect(cost).toBeGreaterThan(0);
    });

    it('computes Gemini cost from token counts', () => {
      const cost = estimateGeminiCost('gemini-2.0-flash', 1000, 500);
      expect(cost).toBeGreaterThan(0);
    });
  });
});
