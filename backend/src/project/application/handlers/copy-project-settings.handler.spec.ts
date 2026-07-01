import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CopyProjectSettingsHandler } from './copy-project-settings.handler';

describe('CopyProjectSettingsHandler', () => {
  const projectAccess = {
    getProjectForTenant: jest.fn(),
  };

  const prisma = {
    project: {
      update: jest.fn().mockResolvedValue({}),
    },
  };

  const commandBus = {
    execute: jest.fn().mockResolvedValue({ added: 5, skipped: 2 }),
  };

  let handler: CopyProjectSettingsHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    projectAccess.getProjectForTenant.mockImplementation(
      (_tenantId: string, projectId: string) =>
        Promise.resolve({
          id: projectId,
          domainProfile: {
            domain: 'sports',
            event: 'FIFA World Cup 2026',
          },
        }),
    );
    handler = new CopyProjectSettingsHandler(
      prisma as never,
      projectAccess as never,
      commandBus as never,
    );
  });

  it('replaces domain profile on target project', async () => {
    const result = await handler.execute({
      tenantId: 'tenant-1',
      targetProjectId: 'target-project',
      sourceProjectId: 'source-project',
      include: ['domainProfile'],
    });

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'target-project' },
      data: {
        domainProfile: {
          domain: 'sports',
          event: 'FIFA World Cup 2026',
        },
      },
    });
    expect(result).toEqual({
      domainProfileCopied: true,
      glossaryAdded: 0,
      glossarySkipped: 0,
    });
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('copies glossary via command bus', async () => {
    projectAccess.getProjectForTenant.mockImplementation(
      (_tenantId: string, projectId: string) =>
        Promise.resolve({ id: projectId, domainProfile: null }),
    );

    const result = await handler.execute({
      tenantId: 'tenant-1',
      targetProjectId: 'target-project',
      sourceProjectId: 'source-project',
      include: ['glossary'],
    });

    expect(commandBus.execute).toHaveBeenCalled();
    expect(result).toEqual({
      domainProfileCopied: false,
      glossaryAdded: 5,
      glossarySkipped: 2,
    });
  });

  it('skips domain profile when source has none', async () => {
    projectAccess.getProjectForTenant.mockImplementation(
      (_tenantId: string, projectId: string) =>
        Promise.resolve({ id: projectId, domainProfile: null }),
    );

    const result = await handler.execute({
      tenantId: 'tenant-1',
      targetProjectId: 'target-project',
      sourceProjectId: 'source-project',
      include: ['domainProfile'],
    });

    expect(prisma.project.update).not.toHaveBeenCalled();
    expect(result.domainProfileCopied).toBe(false);
  });

  it('rejects copying from the same project', async () => {
    await expect(
      handler.execute({
        tenantId: 'tenant-1',
        targetProjectId: 'project-1',
        sourceProjectId: 'project-1',
        include: ['domainProfile'],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('denies access when source project is outside tenant', async () => {
    projectAccess.getProjectForTenant.mockRejectedValueOnce(
      new NotFoundException('Project not found'),
    );

    await expect(
      handler.execute({
        tenantId: 'tenant-1',
        targetProjectId: 'target-project',
        sourceProjectId: 'other-tenant-project',
        include: ['glossary'],
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
