import { detectTerminologyDrift } from './terminology-drift.utils';

describe('detectTerminologyDrift', () => {
  it('detects two variants for the same EN term in Ukrainian', () => {
    const issues = detectTerminologyDrift([
      {
        keyId: 'k1',
        key: 'btn.customer',
        sourceText: 'Customer',
        translations: [{ language: 'uk', value: 'Клієнт' }],
      },
      {
        keyId: 'k2',
        key: 'label.customer',
        sourceText: 'Customer',
        translations: [{ language: 'uk', value: 'Замовник' }],
      },
    ]);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      sourceTerm: 'Customer',
      targetLang: 'uk',
    });
    expect(issues[0].variants).toHaveLength(2);
    expect(issues[0].variants.map((variant) => variant.translation)).toEqual(
      expect.arrayContaining(['Клієнт', 'Замовник']),
    );
  });

  it('detects French variants for Submit', () => {
    const issues = detectTerminologyDrift([
      {
        keyId: 'k1',
        key: 'btn.submit',
        sourceText: 'Submit',
        translations: [{ language: 'fr', value: 'Envoyer' }],
      },
      {
        keyId: 'k2',
        key: 'form.submit',
        sourceText: 'Submit',
        translations: [{ language: 'fr', value: 'Soumettre' }],
      },
    ]);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      sourceTerm: 'Submit',
      targetLang: 'fr',
    });
    expect(issues[0].variants).toHaveLength(2);
  });

  it('returns no issues when translations are consistent', () => {
    const issues = detectTerminologyDrift([
      {
        keyId: 'k1',
        key: 'a',
        sourceText: 'Customer',
        translations: [{ language: 'uk', value: 'Клієнт' }],
      },
      {
        keyId: 'k2',
        key: 'b',
        sourceText: 'Customer',
        translations: [{ language: 'uk', value: 'Клієнт' }],
      },
    ]);

    expect(issues).toHaveLength(0);
  });

  it('ignores source language translations', () => {
    const issues = detectTerminologyDrift(
      [
        {
          keyId: 'k1',
          key: 'a',
          sourceText: 'Hello',
          translations: [{ language: 'en', value: 'Hi' }],
        },
        {
          keyId: 'k2',
          key: 'b',
          sourceText: 'Hello',
          translations: [{ language: 'en', value: 'Hey' }],
        },
      ],
      'en',
    );

    expect(issues).toHaveLength(0);
  });

  it('requires at least two keys with the same exact source text for token terms', () => {
    const issues = detectTerminologyDrift([
      {
        keyId: 'k1',
        key: 'a',
        sourceText: 'Click Submit',
        translations: [{ language: 'fr', value: 'Cliquez Envoyer' }],
      },
      {
        keyId: 'k2',
        key: 'b',
        sourceText: 'Submit Form',
        translations: [{ language: 'fr', value: 'Soumettre le formulaire' }],
      },
    ]);

    expect(issues).toHaveLength(0);
  });
});
