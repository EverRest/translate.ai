import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CopyGlossaryFromProjectCommand } from '../../../glossary/application/glossary.commands';
import { parseDomainProfile } from '../../../shared/domain/domain-profile.utils';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ProjectAccessService } from '../../infrastructure/project-access.service';
import { CopyProjectSettingsCommand } from '../commands/project.commands';

@Injectable()
@CommandHandler(CopyProjectSettingsCommand)
export class CopyProjectSettingsHandler implements ICommandHandler<CopyProjectSettingsCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: CopyProjectSettingsCommand) {
    if (command.sourceProjectId === command.targetProjectId) {
      throw new BadRequestException(
        'Source and target projects must be different',
      );
    }

    if (command.include.length === 0) {
      throw new BadRequestException('At least one setting must be included');
    }

    const source = await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.sourceProjectId,
    );
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.targetProjectId,
    );

    let domainProfileCopied = false;
    let glossaryAdded = 0;
    let glossarySkipped = 0;

    if (command.include.includes('domainProfile')) {
      const parsed = parseDomainProfile(source.domainProfile);
      if (parsed) {
        await this.prisma.project.update({
          where: { id: command.targetProjectId },
          data: {
            domainProfile: parsed as Prisma.InputJsonValue,
          },
        });
        domainProfileCopied = true;
      }
    }

    if (command.include.includes('glossary')) {
      const result = await this.commandBus.execute(
        new CopyGlossaryFromProjectCommand(
          command.tenantId,
          command.sourceProjectId,
          command.targetProjectId,
        ),
      );
      glossaryAdded = result.added;
      glossarySkipped = result.skipped;
    }

    return { domainProfileCopied, glossaryAdded, glossarySkipped };
  }
}
