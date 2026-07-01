import { NotFoundException } from '@nestjs/common';
import { UpdateTranslationKeyHandler } from './translation-key.handlers';
import { StaleTranslationService } from '../services/stale-translation.service';

describe('UpdateTranslationKeyHandler', () => {
  const prisma = {
    translationKey: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const projectAccess = {
    getProjectForTenant: jest.fn(),
  };
  const staleTranslations = {
    invalidateIfSourceChanged: jest.fn(),
  };

  let handler: UpdateTranslationKeyHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new UpdateTranslationKeyHandler(
      prisma as never,
      projectAccess as never,
      staleTranslations as unknown as StaleTranslationService,
    );
    projectAccess.getProjectForTenant.mockResolvedValue({});
  });

  it('invalidates translations when sourceText changes', async () => {
    prisma.translationKey.findFirst.mockResolvedValue({
      id: 'key-1',
      sourceText: 'First Name',
    });
    prisma.translationKey.update.mockResolvedValue({
      id: 'key-1',
      sourceText: 'Given Name',
    });
    staleTranslations.invalidateIfSourceChanged.mockResolvedValue(true);

    await handler.execute({
      tenantId: 't1',
      projectId: 'p1',
      keyId: 'key-1',
      sourceText: 'Given Name',
    });

    expect(staleTranslations.invalidateIfSourceChanged).toHaveBeenCalledWith(
      'key-1',
      'First Name',
      'Given Name',
    );
    expect(prisma.translationKey.update).toHaveBeenCalledWith({
      where: { id: 'key-1' },
      data: { sourceText: 'Given Name' },
    });
  });

  it('throws when key not found', async () => {
    prisma.translationKey.findFirst.mockResolvedValue(null);

    await expect(
      handler.execute({
        tenantId: 't1',
        projectId: 'p1',
        keyId: 'missing',
        sourceText: 'X',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
