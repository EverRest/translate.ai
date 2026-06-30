import {
  buildStructureGenerationPrompt,
  parseStructureJson,
  type StructureNodeInput,
} from './structure-generate.utils';

describe('structure-generate.utils', () => {
  const sampleTree: StructureNodeInput[] = [
    {
      slug: 'title',
      nodeType: 'text',
      sourceText: 'Sign in',
    },
    {
      slug: 'fields',
      nodeType: 'section',
      children: [
        {
          slug: 'email',
          nodeType: 'field',
          children: [
            {
              slug: 'label',
              nodeType: 'label',
              sourceText: 'Email',
            },
          ],
        },
      ],
    },
  ];

  it('builds prompt with object metadata', () => {
    const prompt = buildStructureGenerationPrompt({
      name: 'Login Form',
      slug: 'login_form',
      description: 'User login',
      templateType: 'form',
    });

    expect(prompt.system).toMatch(/JSON/i);
    expect(prompt.user).toContain('Login Form');
    expect(prompt.user).toContain('login_form');
    expect(prompt.user).toContain('User login');
  });

  it('parses fenced JSON from AI response', () => {
    const raw = `\`\`\`json
${JSON.stringify({ nodes: sampleTree })}
\`\`\``;

    expect(parseStructureJson(raw)).toEqual(sampleTree);
  });

  it('parses bare JSON object', () => {
    expect(parseStructureJson(JSON.stringify({ nodes: sampleTree }))).toEqual(
      sampleTree,
    );
  });

  it('rejects invalid slug', () => {
    expect(() =>
      parseStructureJson(
        JSON.stringify({
          nodes: [{ slug: 'Bad-Slug', nodeType: 'text', sourceText: 'Hi' }],
        }),
      ),
    ).toThrow(/invalid node slug/i);
  });

  it('rejects unknown node type', () => {
    expect(() =>
      parseStructureJson(
        JSON.stringify({
          nodes: [{ slug: 'x', nodeType: 'widget', sourceText: 'Hi' }],
        }),
      ),
    ).toThrow(/invalid node type/i);
  });
});
