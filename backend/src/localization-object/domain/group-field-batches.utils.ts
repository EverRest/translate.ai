import type { FlattenNodeInput, FlattenedKeyLeaf } from './flatten-tree.utils';
import { flattenTreeToKeyPaths } from './flatten-tree.utils';

export interface FieldBatchGroup {
  batchGroupId: string;
  leaves: FlattenedKeyLeaf[];
}

function leafFromNode(
  node: FlattenNodeInput,
  objectSlug: string,
  parentSegments: string[],
): FlattenedKeyLeaf {
  const segments = [...parentSegments, node.slug];
  return {
    nodeId: node.id,
    path: [objectSlug, ...segments].join('.'),
    nodeType: node.nodeType,
    sourceText: node.sourceText!.trim(),
    description: node.description,
    context: node.context,
    contentType: node.contentType,
  };
}

function collectLeavesUnderNode(
  node: FlattenNodeInput,
  objectSlug: string,
  parentSegments: string[],
): FlattenedKeyLeaf[] {
  const segments = [...parentSegments, node.slug];
  const direct: FlattenedKeyLeaf[] = [];

  if (node.sourceText?.trim()) {
    direct.push(leafFromNode(node, objectSlug, parentSegments));
  }

  const childLeaves =
    node.children?.flatMap((child) =>
      collectLeavesUnderNode(child, objectSlug, segments),
    ) ?? [];

  return [...direct, ...childLeaves];
}

export function groupLeavesByFieldNode(
  objectSlug: string,
  nodes: FlattenNodeInput[],
  parentSegments: string[] = [],
): FieldBatchGroup[] {
  const groups: FieldBatchGroup[] = [];

  for (const node of nodes) {
    const segments = [...parentSegments, node.slug];

    if (node.nodeType === 'field') {
      const leaves = collectLeavesUnderNode(node, objectSlug, parentSegments);
      if (leaves.length > 0) {
        groups.push({ batchGroupId: node.id, leaves });
      }
      continue;
    }

    if (node.sourceText?.trim()) {
      groups.push({
        batchGroupId: node.id,
        leaves: [leafFromNode(node, objectSlug, parentSegments)],
      });
    }

    if (node.children?.length) {
      groups.push(
        ...groupLeavesByFieldNode(objectSlug, node.children, segments),
      );
    }
  }

  return groups;
}

export function groupLeavesByFieldNodeFromTree(
  objectSlug: string,
  nodes: FlattenNodeInput[],
): FieldBatchGroup[] {
  const batches = groupLeavesByFieldNode(objectSlug, nodes);
  if (batches.length > 0) {
    return batches;
  }

  const leaves = flattenTreeToKeyPaths(objectSlug, nodes);
  return leaves.map((leaf) => ({
    batchGroupId: leaf.nodeId,
    leaves: [leaf],
  }));
}
