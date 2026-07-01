import type { LocalizationNode } from '../types';

export function findNodeById(
  nodes: LocalizationNode[],
  nodeId: string,
): LocalizationNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }
    const nested = findNodeById(node.children ?? [], nodeId);
    if (nested) {
      return nested;
    }
  }
  return null;
}
