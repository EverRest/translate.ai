import { Prisma } from '@prisma/client';
import { UpdateProjectHandler } from './update-project.handler';

describe('UpdateProjectHandler', () => {
  const projectAccess = {
    getProjectForTenant: jest.fn().mockResolvedValue({ id: 'project-1' }),
  };

  const prisma = {
    project: {
      update: jest.fn(),
    },
  };

  let handler: UpdateProjectHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new UpdateProjectHandler(prisma as never, projectAccess as never);
  });

  it('persists domainProfile on update', async () => {
    prisma.project.update.mockResolvedValue({
      id: 'project-1',
      name: 'FIFA',
      description: null,
      domainProfile: {
        domain: 'sports',
        event: 'FIFA World Cup 2026',
      },
      status: 'active',
      createdAt: new Date('2026-01-01'),
      _count: { translationKeys: 0 },
      languages: [],
    });

    await handler.execute({
      tenantId: 'tenant-1',
      projectId: 'project-1',
      domainProfile: {
        domain: 'sports',
        event: 'FIFA World Cup 2026',
      },
    });

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'project-1' },
      data: {
        domainProfile: {
          domain: 'sports',
          event: 'FIFA World Cup 2026',
        },
      },
      include: {
        _count: { select: { translationKeys: true } },
        languages: { select: { code: true, isDefault: true } },
      },
    });
  });

  it('clears domainProfile when null', async () => {
    prisma.project.update.mockResolvedValue({
      id: 'project-1',
      name: 'FIFA',
      description: null,
      domainProfile: null,
      status: 'active',
      createdAt: new Date('2026-01-01'),
      _count: { translationKeys: 0 },
      languages: [],
    });

    await handler.execute({
      tenantId: 'tenant-1',
      projectId: 'project-1',
      domainProfile: null,
    });

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'project-1' },
      data: { domainProfile: Prisma.JsonNull },
      include: expect.any(Object),
    });
  });
});
