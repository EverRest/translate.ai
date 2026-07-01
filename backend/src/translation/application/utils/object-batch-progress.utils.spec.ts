import { JobItemStatus } from '@prisma/client';
import {
  computeObjectBatchProgress,
  isObjectBatchLeaderItem,
  shouldEnqueueObjectBatchItem,
} from './object-batch-progress.utils';

describe('object-batch-progress.utils', () => {
  const items = [
    {
      id: '1',
      batchGroupId: 'field-a',
      language: 'es',
      status: JobItemStatus.completed,
      translationKey: {
        key: 'obj.fields.email.label',
        localizationObjectId: 'obj-1',
      },
    },
    {
      id: '2',
      batchGroupId: 'field-a',
      language: 'es',
      status: JobItemStatus.completed,
      translationKey: {
        key: 'obj.fields.email.placeholder',
        localizationObjectId: 'obj-1',
      },
    },
    {
      id: '3',
      batchGroupId: 'field-b',
      language: 'es',
      status: JobItemStatus.pending,
      translationKey: {
        key: 'obj.fields.password.label',
        localizationObjectId: 'obj-1',
      },
    },
  ];

  it('picks lexicographically first key as batch leader', () => {
    expect(isObjectBatchLeaderItem(items[0], items)).toBe(true);
    expect(isObjectBatchLeaderItem(items[1], items)).toBe(false);
  });

  it('counts objects done when all items are terminal', () => {
    const doneItems = items.map((item) => ({
      ...item,
      status: JobItemStatus.completed,
    }));
    expect(computeObjectBatchProgress(['obj-1'], doneItems).objectsDone).toBe(
      1,
    );
  });

  it('enqueues only pending leaders', () => {
    expect(shouldEnqueueObjectBatchItem(items[2], items)).toBe(true);
    expect(shouldEnqueueObjectBatchItem(items[1], items)).toBe(false);
  });
});
