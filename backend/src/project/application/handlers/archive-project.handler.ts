import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ProjectAccessService } from '../../infrastructure/project-access.service';
import { ArchiveProjectCommand } from '../commands/project.commands';
import { ProjectResponseDto } from '../../presentation/dto/project.dto';

@Injectable()
@CommandHandler(ArchiveProjectCommand)
export class ArchiveProjectHandler implements ICommandHandler<ArchiveProjectCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: ArchiveProjectCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const project = await this.prisma.project.update({
      where: { id: command.projectId },
      data: { status: ProjectStatus.archived },
    });
    return ProjectResponseDto.from(project);
  }
}
