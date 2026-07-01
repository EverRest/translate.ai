import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { parseDomainProfile } from '../../../shared/domain/domain-profile.utils';
import { ProjectAccessService } from '../../infrastructure/project-access.service';
import { UpdateProjectCommand } from '../commands/project.commands';
import { ProjectResponseDto } from '../../presentation/dto/project.dto';

@Injectable()
@CommandHandler(UpdateProjectCommand)
export class UpdateProjectHandler implements ICommandHandler<UpdateProjectCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: UpdateProjectCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const data: Prisma.ProjectUpdateInput = {};

    if (command.name !== undefined) {
      data.name = command.name;
    }
    if (command.description !== undefined) {
      data.description = command.description;
    }
    if (command.domainProfile !== undefined) {
      const parsed = parseDomainProfile(command.domainProfile);
      data.domainProfile =
        parsed === null ? Prisma.JsonNull : (parsed as Prisma.InputJsonValue);
    }
    if (command.autoTerminologyScan !== undefined) {
      data.autoTerminologyScan = command.autoTerminologyScan;
    }

    const project = await this.prisma.project.update({
      where: { id: command.projectId },
      data,
      include: {
        _count: { select: { translationKeys: true } },
        languages: { select: { code: true, isDefault: true } },
      },
    });
    return ProjectResponseDto.from(project);
  }
}
