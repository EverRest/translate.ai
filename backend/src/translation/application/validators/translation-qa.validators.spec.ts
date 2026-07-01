import { runTranslationQaValidators } from './translation-qa.validators';

describe('runTranslationQaValidators', () => {
  it('returns first failing validator result', () => {
    const result = runTranslationQaValidators('Hello {{name}}', 'Hola');
    expect(result.valid).toBe(false);
    expect(result.validator).toBe('PlaceholderValidator');
  });

  it('passes when all validators pass', () => {
    const result = runTranslationQaValidators(
      'Save <strong>{{name}}</strong>',
      'Guardar <strong>{{name}}</strong>',
    );
    expect(result.valid).toBe(true);
  });
});
