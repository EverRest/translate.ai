import {
  buildTranslationPrompts,
  estimateGeminiCost,
  estimateOpenAiCost,
  estimateTokens,
  formatGlossaryPrompt,
} from './prompt.builder';

describe('prompt.builder', () => {
  describe('buildTranslationPrompts', () => {
    it('includes project name, description, and context in user prompt', () => {
      const { systemPrompt, userPrompt } = buildTranslationPrompts(
        'Hello',
        'en',
        'de',
        {
          projectName: 'Shop',
          projectDescription: 'E-commerce storefront',
          keyDescription: 'Checkout button label',
          context: 'Cart page footer',
          contentType: 'ui',
        },
      );

      expect(systemPrompt).toContain('Content type: ui');
      expect(systemPrompt).toContain('short form field label');
      expect(userPrompt).toContain('Project: Shop');
      expect(userPrompt).toContain(
        'Project description: E-commerce storefront',
      );
      expect(userPrompt).toContain('Description: Checkout button label');
      expect(userPrompt).toContain('Context: Cart page footer');
      expect(userPrompt).toContain('Hello');
    });

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

    it('includes quote instruction in system prompt', () => {
      const { systemPrompt } = buildTranslationPrompts('Hello', 'en', 'de');
      expect(systemPrompt).toContain(
        'without explanations or surrounding quotation marks',
      );
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
