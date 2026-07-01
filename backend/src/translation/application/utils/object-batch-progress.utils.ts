import { JobItemStatus } from '@prisma/client';

export function computeObjectBatchProgress(
  objectIds: string[],
  items: Array<{
    status: JobItemStatus;
    translationKey: { localizationObjectId: string | null };
  }>,
): { objectsDone: number; objectsTotal: number } {
  const objectsTotal = objectIds.length;
  let objectsDone = 0;

  for (const objectId of objectIds) {
    const objectItems = items.filter(
      (item) => item.translationKey.localizationObjectId === objectId,
    );
    if (objectItems.length === 0) {
      continue;
    }

    const allTerminal = objectItems.every(
      (item) =>
        item.status === JobItemStatus.completed ||
        item.status === JobItemStatus.failed,
    );
    if (allTerminal) {
      objectsDone += 1;
    }
  }

  return { objectsDone, objectsTotal };
}

export function isObjectBatchLeaderItem<
  T extends {
    id: string;
    batchGroupId: string | null;
    language: string;
    translationKey: { key: string };
  },
>(item: T, items: T[]): boolean {
  if (!item.batchGroupId) {
    return true;
  }

  const siblings = items.filter(
    (candidate) =>
      candidate.batchGroupId === item.batchGroupId &&
      candidate.language === item.language,
  );

  const leader = siblings.sort((a, b) =>
    a.translationKey.key.localeCompare(b.translationKey.key),
  )[0];

  return leader?.id === item.id;
}

export function shouldEnqueueObjectBatchItem<
  T extends {
    id: string;
    batchGroupId: string | null;
    language: string;
    status: JobItemStatus;
    translationKey: { key: string };
  },
>(item: T, items: T[]): boolean {
  if (item.status !== JobItemStatus.pending) {
    return false;
  }
  return isObjectBatchLeaderItem(item, items);
}
