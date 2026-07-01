import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class ProjectAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjectForTenant(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId, status: ProjectStatus.active },
      include: {
        _count: { select: { translationKeys: true } },
        languages: { select: { code: true, isDefault: true } },
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }
}
