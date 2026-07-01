import {
  CommandHandler,
  ICommandHandler,
  IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import {
  getGlossaryPreset,
  GLOSSARY_PRESETS,
} from '../../domain/glossary-presets';
import { GlossaryService } from '../glossary.service';
import {
  ApplyGlossaryPresetCommand,
  ListGlossaryPresetsQuery,
} from '../glossary.commands';

@Injectable()
@QueryHandler(ListGlossaryPresetsQuery)
export class ListGlossaryPresetsHandler implements IQueryHandler<ListGlossaryPresetsQuery> {
  constructor(private readonly projectAccess: ProjectAccessService) {}

  async execute(query: ListGlossaryPresetsQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    return {
      items: GLOSSARY_PRESETS.map((preset) => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        termCount: preset.terms.length,
      })),
    };
  }
}

@Injectable()
@CommandHandler(ApplyGlossaryPresetCommand)
export class ApplyGlossaryPresetHandler implements ICommandHandler<ApplyGlossaryPresetCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly glossaryService: GlossaryService,
  ) {}

  async execute(command: ApplyGlossaryPresetCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const preset = getGlossaryPreset(command.presetId);
    if (!preset) {
      throw new BadRequestException('Unknown glossary preset');
    }

    const glossary = await this.glossaryService.ensureGlossary(
      command.projectId,
    );

    const result = await this.glossaryService.applyPresetTerms(
      glossary.id,
      preset.terms,
    );

    return {
      presetId: preset.id,
      added: result.added,
      skipped: result.skipped,
    };
  }
}
