import {
  CommandHandler,
  ICommandHandler,
  IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import {
  getGlossaryPreset,
  listGlossaryPresets,
} from '../../domain/glossary-presets';
import {
  ApplyGlossaryPresetCommand,
  ListGlossaryPresetsQuery,
} from '../glossary-preset.commands';
import { GlossaryService } from '../glossary.service';

@Injectable()
@QueryHandler(ListGlossaryPresetsQuery)
export class ListGlossaryPresetsHandler implements IQueryHandler<ListGlossaryPresetsQuery> {
  constructor(private readonly projectAccess: ProjectAccessService) {}

  async execute(query: ListGlossaryPresetsQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    return { items: listGlossaryPresets() };
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

    const glossary = await this.glossaryService.getActiveGlossary(
      command.projectId,
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const term of preset.terms) {
      const existing = await this.glossaryService.findTermBySource(
        glossary.id,
        term.sourceTerm,
      );

      if (existing && command.mode === 'merge') {
        skipped += 1;
        continue;
      }

      const result = await this.glossaryService.upsertTerm(command.projectId, {
        sourceTerm: term.sourceTerm,
        targetTerm: term.targetTerm,
        doNotTranslate: term.doNotTranslate,
        note: term.note,
      });

      if (result.created) {
        created += 1;
      } else {
        updated += 1;
      }
    }

    return {
      presetId: preset.id,
      created,
      updated,
      skipped,
      total: preset.terms.length,
    };
  }
}
