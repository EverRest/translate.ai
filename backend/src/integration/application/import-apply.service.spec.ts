import { ImportApplyService } from './import-apply.service';
import { ImportSessionItemAction } from '@prisma/client';

describe('ImportApplyService', () => {
  const prisma = {
    importSessionItem: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    translationKey: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const audit = { log: jest.fn() };
  const staleTranslations = {
    invalidateIfSourceChanged: jest.fn(),
  };

  let service: ImportApplyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ImportApplyService(
      prisma as never,
      audit as never,
      staleTranslations as never,
    );
    prisma.$transaction.mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<void>) => fn(prisma),
    );
    prisma.translationKey.findMany.mockResolvedValue([
      { id: 'key-1', key: 'label.name', sourceText: 'First Name' },
    ]);
    prisma.importSessionItem.findMany.mockResolvedValue([
      {
        id: 'item-1',
        key: 'label.name',
        sourceText: 'Given Name',
        scope: null,
        hints: null,
        action: ImportSessionItemAction.update,
      },
    ]);
    prisma.translationKey.upsert.mockResolvedValue({
      id: 'key-1',
      key: 'label.name',
      sourceText: 'Given Name',
    });
  });

  it('invalidates translations when import updates source text', async () => {
    staleTranslations.invalidateIfSourceChanged.mockResolvedValue(true);

    const result = await service.applySession('sess-1', 'tenant-1', 'proj-1');

    expect(result).toEqual({ applied: 1, skipped: 0 });
    expect(staleTranslations.invalidateIfSourceChanged).toHaveBeenCalledWith(
      'key-1',
      'First Name',
      'Given Name',
    );
  });

  it('does not invalidate when key is newly created', async () => {
    prisma.translationKey.findMany.mockResolvedValue([]);
    prisma.importSessionItem.findMany.mockResolvedValue([
      {
        id: 'item-1',
        key: 'label.name',
        sourceText: 'First Name',
        scope: null,
        hints: null,
        action: ImportSessionItemAction.create,
      },
    ]);

    await service.applySession('sess-1', 'tenant-1', 'proj-1');

    expect(staleTranslations.invalidateIfSourceChanged).not.toHaveBeenCalled();
  });
});
