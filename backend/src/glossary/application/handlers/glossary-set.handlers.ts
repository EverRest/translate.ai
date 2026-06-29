import {
  CommandHandler,
  ICommandHandler,
  IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import {
  ActivateGlossaryCommand,
  CreateGlossaryCommand,
  ListGlossariesQuery,
} from '../glossary-set.commands';
import { GlossaryService } from '../glossary.service';

@Injectable()
@QueryHandler(ListGlossariesQuery)
export class ListGlossariesHandler implements IQueryHandler<ListGlossariesQuery> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly glossaryService: GlossaryService,
  ) {}

  async execute(query: ListGlossariesQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const items = await this.glossaryService.listGlossaries(query.projectId);
    return { items };
  }
}

@Injectable()
@CommandHandler(CreateGlossaryCommand)
export class CreateGlossaryHandler implements ICommandHandler<CreateGlossaryCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly glossaryService: GlossaryService,
  ) {}

  async execute(command: CreateGlossaryCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    try {
      return this.glossaryService.createGlossary(
        command.projectId,
        command.name,
        command.cloneFromActive,
      );
    } catch {
      throw new ConflictException('Glossary name already exists');
    }
  }
}

@Injectable()
@CommandHandler(ActivateGlossaryCommand)
export class ActivateGlossaryHandler implements ICommandHandler<ActivateGlossaryCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly glossaryService: GlossaryService,
  ) {}

  async execute(command: ActivateGlossaryCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    return this.glossaryService.activateGlossary(
      command.projectId,
      command.glossaryId,
    );
  }
}
