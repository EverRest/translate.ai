import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { parseDomainProfile } from '../../../shared/domain/domain-profile.utils';
import { CreateProjectCommand } from '../commands/project.commands';
import { ProjectResponseDto } from '../../presentation/dto/project.dto';

@Injectable()
@CommandHandler(CreateProjectCommand)
export class CreateProjectHandler implements ICommandHandler<CreateProjectCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateProjectCommand) {
    const parsedProfile = parseDomainProfile(command.domainProfile);
    const project = await this.prisma.project.create({
      data: {
        tenantId: command.tenantId,
        name: command.name,
        description: command.description,
        ...(parsedProfile
          ? { domainProfile: parsedProfile as Prisma.InputJsonValue }
          : {}),
      },
    });
    return ProjectResponseDto.from(project);
  }
}
