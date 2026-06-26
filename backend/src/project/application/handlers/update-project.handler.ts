import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
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

    const project = await this.prisma.project.update({
      where: { id: command.projectId },
      data: {
        name: command.name,
        description: command.description,
      },
    });
    return ProjectResponseDto.from(project);
  }
}
