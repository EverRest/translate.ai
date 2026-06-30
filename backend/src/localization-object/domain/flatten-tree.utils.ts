const SLUG_PATTERN = /^[a-z][a-z0-9_]*$/;

export interface FlattenNodeInput {
  id: string;
  slug: string;
  nodeType: string;
  sourceText?: string | null;
  description?: string | null;
  context?: string | null;
  contentType?: string | null;
  children?: FlattenNodeInput[];
}

export interface FlattenedKeyLeaf {
  nodeId: string;
  path: string;
  nodeType: string;
  sourceText: string;
  description?: string | null;
  context?: string | null;
  contentType?: string | null;
}

function assertSlug(value: string, label: string): void {
  if (!SLUG_PATTERN.test(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
}

export function flattenTreeToKeyPaths(
  objectSlug: string,
  nodes: FlattenNodeInput[],
  parentSegments: string[] = [],
): FlattenedKeyLeaf[] {
  assertSlug(objectSlug, 'object slug');

  const leaves: FlattenedKeyLeaf[] = [];

  for (const node of nodes) {
    assertSlug(node.slug, 'node slug');
    const segments = [...parentSegments, node.slug];
    const path = [objectSlug, ...segments].join('.');

    if (node.sourceText?.trim()) {
      leaves.push({
        nodeId: node.id,
        path,
        nodeType: node.nodeType,
        sourceText: node.sourceText.trim(),
        description: node.description,
        context: node.context,
        contentType: node.contentType,
      });
    }

    if (node.children?.length) {
      leaves.push(
        ...flattenTreeToKeyPaths(objectSlug, node.children, segments),
      );
    }
  }

  return leaves;
}
