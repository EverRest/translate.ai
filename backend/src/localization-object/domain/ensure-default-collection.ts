import type { PrismaService } from '../../shared/prisma/prisma.service';

export const DEFAULT_COLLECTION_SLUG = 'general';
export const DEFAULT_COLLECTION_NAME = 'General';

export async function ensureDefaultCollection(
  prisma: PrismaService,
  projectId: string,
): Promise<string> {
  const existing = await prisma.entityCollection.findFirst({
    where: { projectId, slug: DEFAULT_COLLECTION_SLUG },
    select: { id: true },
  });
  if (existing) {
    return existing.id;
  }

  const created = await prisma.entityCollection.create({
    data: {
      projectId,
      slug: DEFAULT_COLLECTION_SLUG,
      name: DEFAULT_COLLECTION_NAME,
    },
    select: { id: true },
  });
  return created.id;
}
