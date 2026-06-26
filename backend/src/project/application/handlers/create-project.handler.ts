import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateProjectCommand } from '../commands/project.commands';
import { ProjectResponseDto } from '../../presentation/dto/project.dto';

@Injectable()
@CommandHandler(CreateProjectCommand)
export class CreateProjectHandler implements ICommandHandler<CreateProjectCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateProjectCommand) {
    const project = await this.prisma.project.create({
      data: {
        tenantId: command.tenantId,
        name: command.name,
        description: command.description,
      },
    });
    return ProjectResponseDto.from(project);
  }
}
