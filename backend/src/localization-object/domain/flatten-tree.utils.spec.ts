import {
  flattenTreeToKeyPaths,
  type FlattenNodeInput,
} from './flatten-tree.utils';

describe('flattenTreeToKeyPaths', () => {
  const tree: FlattenNodeInput[] = [
    {
      id: 'n-title',
      slug: 'title',
      nodeType: 'text',
      sourceText: 'Create account',
    },
    {
      id: 'n-fields',
      slug: 'fields',
      nodeType: 'section',
      children: [
        {
          id: 'n-email',
          slug: 'email',
          nodeType: 'field',
          children: [
            {
              id: 'n-label',
              slug: 'label',
              nodeType: 'label',
              sourceText: 'Email',
            },
            {
              id: 'n-placeholder',
              slug: 'placeholder',
              nodeType: 'placeholder',
              sourceText: 'Enter email',
            },
            {
              id: 'n-errors',
              slug: 'errors',
              nodeType: 'section',
              children: [
                {
                  id: 'n-required',
                  slug: 'required',
                  nodeType: 'error',
                  sourceText: 'Email is required',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'n-submit',
      slug: 'buttons',
      nodeType: 'section',
      children: [
        {
          id: 'n-btn-submit',
          slug: 'submit',
          nodeType: 'button',
          sourceText: 'Create account',
        },
      ],
    },
  ];

  it('flattens leaves to dotted paths under object slug', () => {
    const result = flattenTreeToKeyPaths('registration_form', tree);

    expect(result.map((item) => item.path)).toEqual([
      'registration_form.title',
      'registration_form.fields.email.label',
      'registration_form.fields.email.placeholder',
      'registration_form.fields.email.errors.required',
      'registration_form.buttons.submit',
    ]);
  });

  it('skips nodes without sourceText', () => {
    const result = flattenTreeToKeyPaths('registration_form', tree);

    expect(result).toHaveLength(5);
    expect(result.every((item) => item.sourceText.length > 0)).toBe(true);
  });

  it('preserves node id and metadata on each leaf', () => {
    const result = flattenTreeToKeyPaths('registration_form', tree);
    const required = result.find(
      (item) => item.path === 'registration_form.fields.email.errors.required',
    );

    expect(required).toMatchObject({
      nodeId: 'n-required',
      nodeType: 'error',
      sourceText: 'Email is required',
    });
  });

  it('rejects invalid object slug', () => {
    expect(() => flattenTreeToKeyPaths('Registration-Form', tree)).toThrow(
      /invalid object slug/i,
    );
  });

  it('rejects invalid node slug', () => {
    expect(() =>
      flattenTreeToKeyPaths('registration_form', [
        { id: 'x', slug: 'Bad-Slug', nodeType: 'text', sourceText: 'Hi' },
      ]),
    ).toThrow(/invalid node slug/i);
  });
});
