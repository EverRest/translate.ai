import { LocalizationNodeType } from '@prisma/client';

export interface LocalizationNodeRow {
  id: string;
  parentId: string | null;
  sortOrder: number;
  slug: string;
  nodeType: LocalizationNodeType;
  label: string | null;
  sourceText: string | null;
  description: string | null;
  context: string | null;
  contentType: string | null;
  translationKeyId: string | null;
}

export interface LocalizationNodeTree extends LocalizationNodeRow {
  children: LocalizationNodeTree[];
}

export function buildTreeFromNodes(
  nodes: LocalizationNodeRow[],
): LocalizationNodeTree[] {
  const byId = new Map<string, LocalizationNodeTree>();

  for (const node of nodes) {
    byId.set(node.id, { ...node, children: [] });
  }

  const roots: LocalizationNodeTree[] = [];

  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRecursive = (items: LocalizationNodeTree[]): void => {
    items.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug),
    );
    for (const item of items) {
      sortRecursive(item.children);
    }
  };

  sortRecursive(roots);
  return roots;
}
