import {
  groupLeavesByFieldNode,
  groupLeavesByFieldNodeFromTree,
} from './group-field-batches.utils';

describe('group-field-batches.utils', () => {
  const tree = [
    {
      id: 'n-fields',
      slug: 'fields',
      nodeType: 'section',
      children: [
        {
          id: 'n-email-field',
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
                  sourceText: 'Required',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'n-title',
      slug: 'title',
      nodeType: 'text',
      sourceText: 'Sign up',
    },
  ];

  it('groups label, placeholder, and errors under one field batch', () => {
    const groups = groupLeavesByFieldNode('signup_form', tree);

    const emailBatch = groups.find((g) => g.batchGroupId === 'n-email-field');
    expect(emailBatch).toBeDefined();
    expect(emailBatch!.leaves).toHaveLength(3);
    expect(emailBatch!.leaves.map((leaf) => leaf.path)).toEqual([
      'signup_form.fields.email.label',
      'signup_form.fields.email.placeholder',
      'signup_form.fields.email.errors.required',
    ]);
  });

  it('treats standalone text nodes as single-leaf batches', () => {
    const groups = groupLeavesByFieldNode('signup_form', tree);
    const titleBatch = groups.find((g) => g.batchGroupId === 'n-title');
    expect(titleBatch?.leaves).toHaveLength(1);
    expect(titleBatch?.leaves[0]?.path).toBe('signup_form.title');
  });

  it('falls back to per-leaf batches when tree has no field nodes', () => {
    const flatTree = [
      {
        id: 'n-a',
        slug: 'a',
        nodeType: 'text',
        sourceText: 'Hello',
      },
    ];
    const groups = groupLeavesByFieldNodeFromTree('obj', flatTree);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.batchGroupId).toBe('n-a');
  });
});
