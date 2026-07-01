import { StaleTranslationService } from './stale-translation.service';

describe('StaleTranslationService', () => {
  const prisma = {
    translation: {
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: StaleTranslationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StaleTranslationService(prisma as never);
  });

  it('invalidateForKey sets review status on non-empty translations', async () => {
    prisma.translation.updateMany.mockResolvedValue({ count: 3 });

    const count = await service.invalidateForKey('key-1');

    expect(count).toBe(3);
    expect(prisma.translation.updateMany).toHaveBeenCalledWith({
      where: {
        translationKeyId: 'key-1',
        NOT: { value: '' },
      },
      data: { status: 'review' },
    });
  });

  it('invalidateIfSourceChanged no-ops on whitespace-only edit', async () => {
    const changed = await service.invalidateIfSourceChanged(
      'key-1',
      'Hello',
      '  Hello  ',
    );

    expect(changed).toBe(false);
    expect(prisma.translation.updateMany).not.toHaveBeenCalled();
  });

  it('invalidateIfSourceChanged invalidates on real source change', async () => {
    prisma.translation.updateMany.mockResolvedValue({ count: 2 });

    const changed = await service.invalidateIfSourceChanged(
      'key-1',
      'First Name',
      'Given Name',
    );

    expect(changed).toBe(true);
    expect(prisma.translation.updateMany).toHaveBeenCalled();
  });

  it('captureSnapshotForTranslation updates snapshot', async () => {
    await service.captureSnapshotForTranslation('tr-1', 'Given Name');

    expect(prisma.translation.update).toHaveBeenCalledWith({
      where: { id: 'tr-1' },
      data: { sourceTextSnapshot: 'Given Name' },
    });
  });
});
