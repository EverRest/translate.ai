import { JobItemStatus } from '@prisma/client';
import { countPlaceholders } from './placeholder.utils';

export type JobPlaceholderSummaryItem = {
  translationKeyId: string;
  status: JobItemStatus;
  sourceText: string;
};

export type JobPlaceholderSummary = {
  placeholdersTotal: number;
  placeholdersPreserved: number;
};

export function buildJobPlaceholderSummary(
  items: JobPlaceholderSummaryItem[],
): JobPlaceholderSummary | null {
  const byKey = new Map<string, JobPlaceholderSummaryItem[]>();

  for (const item of items) {
    const group = byKey.get(item.translationKeyId) ?? [];
    group.push(item);
    byKey.set(item.translationKeyId, group);
  }

  let placeholdersTotal = 0;
  let placeholdersPreserved = 0;

  for (const keyItems of byKey.values()) {
    const placeholderCount = countPlaceholders(keyItems[0].sourceText);
    if (placeholderCount === 0) {
      continue;
    }

    placeholdersTotal += placeholderCount;

    const allCompleted = keyItems.every(
      (item) => item.status === JobItemStatus.completed,
    );
    if (allCompleted) {
      placeholdersPreserved += placeholderCount;
    }
  }

  if (placeholdersTotal === 0) {
    return null;
  }

  return { placeholdersTotal, placeholdersPreserved };
}
