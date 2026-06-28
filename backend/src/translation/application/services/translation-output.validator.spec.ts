import { TranslationOutputValidator } from './translation-output.validator';

describe('TranslationOutputValidator', () => {
  const config = {
    get: (_key: string, defaultValue?: unknown) => defaultValue,
  };
  const validator = new TranslationOutputValidator(config as never);

  it('accepts a plausible translation', () => {
    const result = validator.validate('Zur Kasse', 'Checkout', 'en', 'de');
    expect(result.valid).toBe(true);
    expect(result.score).toBe(0.85);
  });

  it('rejects empty output', () => {
    const result = validator.validate('   ', 'Checkout', 'en', 'de');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('empty');
  });

  it('rejects refusal phrases', () => {
    const result = validator.validate(
      'I cannot translate this text.',
      'Checkout',
      'en',
      'de',
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('refusal');
  });

  it('rejects identical source and target for different languages', () => {
    const result = validator.validate('Checkout', 'Checkout', 'en', 'de');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('identical');
  });

  it('rejects quote-only output', () => {
    const result = validator.validate('" "', 'Save', 'en', 'de');
    expect(result.valid).toBe(false);
  });

  it('rejects unusually long output', () => {
    const result = validator.validate('a'.repeat(200), 'Checkout', 'en', 'de');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('long');
  });

  it('rejects Latin output for Cyrillic target language', () => {
    const result = validator.validate(
      'This is clearly English text only',
      'Оплатити',
      'ua',
      'ua',
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('script');
  });

  it('allows short single-token Latin labels for Cyrillic targets', () => {
    const result = validator.validate('Cast', 'Cast', 'en', 'ru');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('identical');
  });

  it('skips script check for short single-token non-identical output', () => {
    const result = validator.validate('Roles', 'Cast', 'en', 'ru');
    expect(result.valid).toBe(true);
  });

  it('can be disabled via config', () => {
    const disabled = new TranslationOutputValidator({
      get: () => false,
    } as never);
    const result = disabled.validate('', 'Checkout', 'en', 'de');
    expect(result.valid).toBe(true);
  });

  it('rejects output that drops placeholders after heuristics pass', () => {
    const result = validator.validate(
      'Hola amigo',
      'Hello {{name}}',
      'en',
      'es',
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('PlaceholderValidator');
  });

  it('skips QA validators when TRANSLATION_QA_VALIDATORS_ENABLED is false', () => {
    const qaDisabled = new TranslationOutputValidator({
      get: (key: string, defaultValue?: unknown) => {
        if (key === 'TRANSLATION_QA_VALIDATORS_ENABLED') {
          return false;
        }
        return defaultValue;
      },
    } as never);
    const result = qaDisabled.validate(
      'Hola amigo',
      'Hello {{name}}',
      'en',
      'es',
    );
    expect(result.valid).toBe(true);
  });
});
