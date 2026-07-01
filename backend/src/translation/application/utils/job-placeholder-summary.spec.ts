import { JobItemStatus } from '@prisma/client';
import { buildJobPlaceholderSummary } from './job-placeholder-summary';

function item(
  translationKeyId: string,
  sourceText: string,
  status: JobItemStatus,
) {
  return { translationKeyId, sourceText, status };
}

describe('buildJobPlaceholderSummary', () => {
  it('returns null when no placeholders exist', () => {
    expect(
      buildJobPlaceholderSummary([
        item('key-1', 'Hello world', JobItemStatus.completed),
        item('key-2', 'Checkout', JobItemStatus.completed),
      ]),
    ).toBeNull();
  });

  it('deduplicates placeholder counts per key across target languages', () => {
    const result = buildJobPlaceholderSummary([
      item('key-1', 'Hello {{name}}', JobItemStatus.completed),
      item('key-1', 'Hello {{name}}', JobItemStatus.completed),
      item('key-2', 'Price: %%amount%%', JobItemStatus.completed),
      item('key-2', 'Price: %%amount%%', JobItemStatus.completed),
    ]);

    expect(result).toEqual({
      placeholdersTotal: 2,
      placeholdersPreserved: 2,
    });
  });

  it('excludes placeholders from keys with any non-completed item (strict)', () => {
    const result = buildJobPlaceholderSummary([
      item('key-1', 'Hello {{name}}', JobItemStatus.completed),
      item('key-1', 'Hello {{name}}', JobItemStatus.failed),
      item('key-2', 'Price: %%amount%%', JobItemStatus.completed),
    ]);

    expect(result).toEqual({
      placeholdersTotal: 2,
      placeholdersPreserved: 1,
    });
  });

  it('counts all placeholders when every item for each key is completed', () => {
    const result = buildJobPlaceholderSummary([
      item('key-1', 'Hello {{name}}', JobItemStatus.completed),
      item('key-2', 'You have {{count}} items', JobItemStatus.completed),
      item('key-3', 'Price: %%amount%%', JobItemStatus.completed),
    ]);

    expect(result).toEqual({
      placeholdersTotal: 3,
      placeholdersPreserved: 3,
    });
  });
});
