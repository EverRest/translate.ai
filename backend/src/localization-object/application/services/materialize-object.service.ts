import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { buildTreeFromNodes } from '../../domain/build-tree.utils';
import { flattenTreeToKeyPaths } from '../../domain/flatten-tree.utils';
import { resolveNodeContentType } from '../../domain/node-content-type.utils';

@Injectable()
export class MaterializeObjectService {
  constructor(private readonly prisma: PrismaService) {}

  async materialize(projectId: string, objectId: string) {
    const object = await this.prisma.localizationObject.findFirst({
      where: { id: objectId, projectId },
    });
    if (!object) {
      throw new NotFoundException('Localization object not found');
    }

    const nodes = await this.prisma.localizationNode.findMany({
      where: { objectId },
      orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
    });

    const tree = buildTreeFromNodes(nodes);
    const leaves = flattenTreeToKeyPaths(
      object.slug,
      tree.map((node) => ({
        id: node.id,
        slug: node.slug,
        nodeType: node.nodeType,
        sourceText: node.sourceText,
        description: node.description,
        context: node.context,
        contentType: node.contentType,
        children: mapChildren(node.children),
      })),
    );

    let created = 0;
    let updated = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const leaf of leaves) {
        const contentType = resolveNodeContentType({
          nodeType: leaf.nodeType,
          contentType: leaf.contentType,
        });

        const existing = await tx.translationKey.findFirst({
          where: { projectId, key: leaf.path },
        });

        if (existing) {
          if (
            existing.localizationObjectId &&
            existing.localizationObjectId !== objectId
          ) {
            throw new ConflictException(
              `Translation key already exists for another object: ${leaf.path}`,
            );
          }

          await tx.translationKey.update({
            where: { id: existing.id },
            data: {
              sourceText: leaf.sourceText,
              description: leaf.description,
              context: leaf.context,
              contentType,
              localizationObjectId: objectId,
            },
          });
          await tx.localizationNode.update({
            where: { id: leaf.nodeId },
            data: { translationKeyId: existing.id },
          });
          updated += 1;
          continue;
        }

        const key = await tx.translationKey.create({
          data: {
            projectId,
            key: leaf.path,
            sourceText: leaf.sourceText,
            description: leaf.description,
            context: leaf.context,
            contentType,
            localizationObjectId: objectId,
          },
        });
        await tx.localizationNode.update({
          where: { id: leaf.nodeId },
          data: { translationKeyId: key.id },
        });
        created += 1;
      }

      await tx.localizationObject.update({
        where: { id: objectId },
        data: { status: 'materialized' },
      });
    });

    return { created, updated, total: leaves.length };
  }
}

function mapChildren(
  children: ReturnType<typeof buildTreeFromNodes>,
): Parameters<typeof flattenTreeToKeyPaths>[1] {
  return children.map((node) => ({
    id: node.id,
    slug: node.slug,
    nodeType: node.nodeType,
    sourceText: node.sourceText,
    description: node.description,
    context: node.context,
    contentType: node.contentType,
    children: mapChildren(node.children),
  }));
}
