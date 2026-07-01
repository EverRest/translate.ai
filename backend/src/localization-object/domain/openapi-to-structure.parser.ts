import type { StructureNodeInput } from './structure-generate.utils';

const SLUG_PATTERN = /^[a-z][a-z0-9_]*$/;
const MAX_SLUG_LEN = 48;

export interface OpenApiParsedEntity {
  name: string;
  slug: string;
  tag: string;
  nodes: StructureNodeInput[];
  nodeCount: number;
}

export interface OpenApiParseResult {
  entities: OpenApiParsedEntity[];
  warnings: string[];
  availableTags: string[];
}

interface OpenApiDocument {
  openapi?: string;
  swagger?: string;
  info?: { title?: string; description?: string };
  tags?: Array<{ name: string; description?: string }>;
  paths?: Record<string, Record<string, OpenApiOperation>>;
}

interface OpenApiOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: Array<{
    name?: string;
    in?: string;
    description?: string;
    schema?: { type?: string };
  }>;
  requestBody?: {
    description?: string;
    content?: Record<string, { schema?: OpenApiSchema }>;
  };
  responses?: Record<string, { description?: string }>;
}

interface OpenApiSchema {
  type?: string;
  properties?: Record<string, { type?: string; description?: string }>;
  description?: string;
}

function slugify(value: string): string {
  const withUnderscores = value
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();
  const base = withUnderscores
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

  let slug = base.match(SLUG_PATTERN) ? base : `x_${base}`;
  if (!slug.match(SLUG_PATTERN)) {
    slug = 'item';
  }
  if (slug.length > MAX_SLUG_LEN) {
    slug = slug.slice(0, MAX_SLUG_LEN).replace(/_+$/, '');
  }
  return slug;
}

function pathToSlug(path: string): string {
  const trimmed = path
    .replace(/^\//, '')
    .replace(/\//g, '_')
    .replace(/[{}]/g, '');
  return slugify(trimmed || 'root');
}

function countNodes(nodes: StructureNodeInput[]): number {
  return nodes.reduce(
    (sum, node) => sum + 1 + (node.children ? countNodes(node.children) : 0),
    0,
  );
}

function textLeaf(slug: string, sourceText: string): StructureNodeInput {
  return {
    slug,
    nodeType: 'text',
    sourceText,
    contentType: 'technical',
  };
}

function buildOperationNodes(
  path: string,
  method: string,
  operation: OpenApiOperation,
): StructureNodeInput[] {
  const children: StructureNodeInput[] = [];
  const opSlug = slugify(operation.operationId ?? method);

  if (operation.summary) {
    children.push(textLeaf('summary', operation.summary));
  }
  if (operation.description && operation.description !== operation.summary) {
    children.push(textLeaf('description', operation.description));
  }

  if (operation.parameters?.length) {
    const paramNodes: StructureNodeInput[] = operation.parameters
      .filter((param) => param.description || param.name)
      .map((param) => ({
        slug: slugify(param.name ?? 'param'),
        nodeType: 'field',
        label: param.name,
        sourceText: param.description ?? param.name ?? '',
        contentType: 'technical',
        children: param.description
          ? [
              {
                slug: 'label',
                nodeType: 'label',
                sourceText: param.description,
              },
            ]
          : undefined,
      }));
    if (paramNodes.length > 0) {
      children.push({
        slug: 'parameters',
        nodeType: 'section',
        children: paramNodes,
      });
    }
  }

  const requestSchema =
    operation.requestBody?.content?.['application/json']?.schema ??
    operation.requestBody?.content?.['*/*']?.schema;
  if (requestSchema?.properties) {
    const bodyFields = Object.entries(requestSchema.properties).map(
      ([key, prop]) => ({
        slug: slugify(key),
        nodeType: 'field',
        label: key,
        sourceText: prop.description ?? key,
        contentType: 'technical',
      }),
    );
    if (bodyFields.length > 0) {
      children.push({
        slug: 'request_body',
        nodeType: 'section',
        children: bodyFields,
      });
    }
  } else if (operation.requestBody?.description) {
    children.push(textLeaf('request_body', operation.requestBody.description));
  }

  if (operation.responses) {
    const responseChildren: StructureNodeInput[] = [];
    for (const [code, response] of Object.entries(operation.responses)) {
      if (!response.description) {
        continue;
      }
      const isError = code.startsWith('4') || code.startsWith('5');
      responseChildren.push({
        slug: slugify(`status_${code}`),
        nodeType: isError ? 'error' : 'text',
        sourceText: response.description,
        contentType: 'technical',
      });
    }
    if (responseChildren.length > 0) {
      children.push({
        slug: 'responses',
        nodeType: 'section',
        children: responseChildren,
      });
    }
  }

  return [
    {
      slug: opSlug,
      nodeType: 'section',
      label: `${method.toUpperCase()} ${path}`,
      children,
    },
  ];
}

function buildEntityForTag(
  doc: OpenApiDocument,
  tag: string,
): OpenApiParsedEntity {
  const nodes: StructureNodeInput[] = [];
  const tagMeta = doc.tags?.find((item) => item.name === tag);
  if (tagMeta?.description) {
    nodes.push(textLeaf('overview', tagMeta.description));
  }

  const paths = doc.paths ?? {};
  for (const [path, pathItem] of Object.entries(paths)) {
    const pathSlug = pathToSlug(path);
    const operations: Array<[string, OpenApiOperation]> = [];
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const op = pathItem[method];
      if (op && op.tags?.includes(tag)) {
        operations.push([method, op]);
      }
    }
    if (operations.length === 0) {
      continue;
    }

    const pathChildren: StructureNodeInput[] = [];
    for (const [method, operation] of operations) {
      pathChildren.push(...buildOperationNodes(path, method, operation));
    }

    nodes.push({
      slug: pathSlug,
      nodeType: 'section',
      label: path,
      children: pathChildren,
    });
  }

  const entitySlug = slugify(tag);
  return {
    name: tag,
    slug: entitySlug,
    tag,
    nodes,
    nodeCount: countNodes(nodes),
  };
}

function collectTags(doc: OpenApiDocument): string[] {
  const tagSet = new Set<string>();
  for (const tag of doc.tags ?? []) {
    tagSet.add(tag.name);
  }
  for (const pathItem of Object.values(doc.paths ?? {})) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const op = pathItem[method] as OpenApiOperation | undefined;
      for (const tag of op?.tags ?? []) {
        tagSet.add(tag);
      }
    }
  }
  return [...tagSet].sort();
}

export function parseOpenApiSpec(
  specText: string,
  selectedTags?: string[],
): OpenApiParseResult {
  const warnings: string[] = [];
  let doc: OpenApiDocument;
  try {
    doc = JSON.parse(specText) as OpenApiDocument;
  } catch {
    throw new Error('Invalid OpenAPI spec: expected JSON');
  }

  if (!doc.openapi && !doc.swagger) {
    throw new Error('Invalid OpenAPI spec: missing openapi or swagger version');
  }
  if (doc.swagger) {
    warnings.push('Swagger 2.0 detected — only basic fields are imported');
  }

  const availableTags = collectTags(doc);
  if (availableTags.length === 0) {
    warnings.push('No tags found — using default "api" tag');
    availableTags.push('api');
    for (const pathItem of Object.values(doc.paths ?? {})) {
      for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
        const op = pathItem[method] as OpenApiOperation | undefined;
        if (op && !op.tags?.length) {
          op.tags = ['api'];
        }
      }
    }
  }

  const tagsToImport =
    selectedTags && selectedTags.length > 0 ? selectedTags : availableTags;

  const entities = tagsToImport.map((tag) => buildEntityForTag(doc, tag));

  return { entities, warnings, availableTags };
}
