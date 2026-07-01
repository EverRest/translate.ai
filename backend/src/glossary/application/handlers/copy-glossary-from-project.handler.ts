import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { CopyGlossaryFromProjectCommand } from '../glossary.commands';
import { GlossaryService } from '../glossary.service';

@Injectable()
@CommandHandler(CopyGlossaryFromProjectCommand)
export class CopyGlossaryFromProjectHandler implements ICommandHandler<CopyGlossaryFromProjectCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly glossaryService: GlossaryService,
  ) {}

  async execute(command: CopyGlossaryFromProjectCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.sourceProjectId,
    );
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.targetProjectId,
    );

    return this.glossaryService.copyTermsFromProject(
      command.sourceProjectId,
      command.targetProjectId,
    );
  }
}
