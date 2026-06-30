const SLUG_PATTERN = /^[a-z][a-z0-9_]*$/;

const VALID_NODE_TYPES = new Set([
  'section',
  'field',
  'button',
  'label',
  'placeholder',
  'hint',
  'validation',
  'error',
  'success',
  'tooltip',
  'email_subject',
  'email_body',
  'notification',
  'text',
]);

export interface StructureNodeInput {
  slug: string;
  nodeType: string;
  label?: string;
  sourceText?: string;
  description?: string;
  context?: string;
  contentType?: string;
  children?: StructureNodeInput[];
}

function assertSlug(value: string): void {
  if (!SLUG_PATTERN.test(value)) {
    throw new Error(`Invalid node slug: ${value}`);
  }
}

function assertNodeType(value: string): void {
  if (!VALID_NODE_TYPES.has(value)) {
    throw new Error(`Invalid node type: ${value}`);
  }
}

export function buildStructureGenerationPrompt(input: {
  name: string;
  slug: string;
  description?: string | null;
  templateType: string;
}): { system: string; user: string } {
  const system = `You design localization trees for software UI (forms, pages, emails).
Return ONLY valid JSON — no markdown fences, no commentary.

Schema:
{
  "nodes": [
    {
      "slug": "snake_case_segment",
      "nodeType": "section|field|button|label|placeholder|hint|validation|error|success|tooltip|email_subject|email_body|notification|text",
      "sourceText": "English copy for leaf nodes only",
      "label": "optional display label",
      "children": []
    }
  ]
}

Rules:
- Use snake_case slugs matching [a-z][a-z0-9_]*
- Sections group fields; leaves with copy must include sourceText in English
- Include buttons, placeholders, and validation errors where appropriate
- Typical form: title, fields.*, buttons.*`;

  const user = [
    `Object name: ${input.name}`,
    `Object slug: ${input.slug}`,
    `Template type: ${input.templateType}`,
    input.description ? `Description: ${input.description}` : '',
    'Generate a complete node tree with realistic English source strings.',
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
}

function extractJsonPayload(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(candidate) as unknown;
}

function normalizeNode(node: unknown): StructureNodeInput {
  if (!node || typeof node !== 'object') {
    throw new Error('Invalid node entry');
  }

  const record = node as Record<string, unknown>;
  const slug = typeof record.slug === 'string' ? record.slug : '';
  const nodeType = typeof record.nodeType === 'string' ? record.nodeType : '';

  assertSlug(slug);
  assertNodeType(nodeType);

  const children = Array.isArray(record.children)
    ? record.children.map((child) => normalizeNode(child))
    : undefined;

  return {
    slug,
    nodeType,
    label: typeof record.label === 'string' ? record.label : undefined,
    sourceText:
      typeof record.sourceText === 'string' ? record.sourceText : undefined,
    description:
      typeof record.description === 'string' ? record.description : undefined,
    context: typeof record.context === 'string' ? record.context : undefined,
    contentType:
      typeof record.contentType === 'string' ? record.contentType : undefined,
    children,
  };
}

export function parseStructureJson(raw: string): StructureNodeInput[] {
  const payload = extractJsonPayload(raw);
  if (!payload || typeof payload !== 'object') {
    throw new Error('Structure JSON must be an object');
  }

  const nodes = (payload as { nodes?: unknown }).nodes;
  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error('Structure JSON must include a non-empty nodes array');
  }

  return nodes.map((node) => normalizeNode(node));
}
