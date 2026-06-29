import type { LocalizationNodeType, Prisma } from '@prisma/client';
import type { StructureNodeInput } from '../../domain/structure-generate.utils';

type Tx = Prisma.TransactionClient;

export async function applyStructureTree(
  prisma: { $transaction: <T>(fn: (tx: Tx) => Promise<T>) => Promise<T> },
  objectId: string,
  nodes: StructureNodeInput[],
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.localizationNode.deleteMany({ where: { objectId } });
    await createNodesRecursive(tx, objectId, nodes, null, 0);
    await tx.localizationObject.update({
      where: { id: objectId },
      data: {
        status: 'draft',
        generationStatus: 'completed',
        generationError: null,
      },
    });
  });
}

async function createNodesRecursive(
  tx: Tx,
  objectId: string,
  nodes: StructureNodeInput[],
  parentId: string | null,
  startOrder: number,
): Promise<void> {
  for (let index = 0; index < nodes.length; index += 1) {
    const input = nodes[index];
    const created = await tx.localizationNode.create({
      data: {
        objectId,
        parentId,
        sortOrder: startOrder + index,
        slug: input.slug,
        nodeType: input.nodeType as LocalizationNodeType,
        label: input.label ?? null,
        sourceText: input.sourceText ?? null,
        description: input.description ?? null,
        context: input.context ?? null,
        contentType: input.contentType ?? null,
      },
    });

    if (input.children?.length) {
      await createNodesRecursive(tx, objectId, input.children, created.id, 0);
    }
  }
}
