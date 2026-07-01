import {
  buildObjectBatchPrompts,
  parseObjectBatchResponse,
} from './object-batch-prompt.builder';

describe('object-batch-prompt.builder', () => {
  it('builds coherent field batch prompt', () => {
    const { systemPrompt, userPrompt } = buildObjectBatchPrompts(
      [
        {
          keyPath: 'form.fields.email.label',
          role: 'label',
          sourceText: 'Email',
        },
        {
          keyPath: 'form.fields.email.placeholder',
          role: 'placeholder',
          sourceText: 'Enter email',
        },
      ],
      'en',
      'es',
      { fieldLabel: 'Email' },
    );

    expect(systemPrompt).toContain('coherent UI element');
    expect(userPrompt).toContain('form.fields.email.label');
  });

  it('parses JSON array response', () => {
    const result = parseObjectBatchResponse(
      JSON.stringify([
        { keyPath: 'a', translatedText: 'Uno' },
        { keyPath: 'b', translatedText: 'Dos' },
      ]),
      ['a', 'b'],
    );

    expect(result).toEqual({ a: 'Uno', b: 'Dos' });
  });

  it('throws when a key is missing', () => {
    expect(() =>
      parseObjectBatchResponse(
        JSON.stringify([{ keyPath: 'a', translatedText: 'Uno' }]),
        ['a', 'b'],
      ),
    ).toThrow(/missing translation for b/);
  });
});
