import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProjectModule } from '../project/project.module';
import { GlossaryAnalyzeService } from './application/glossary-analyze.service';
import {
  CreateGlossaryTermHandler,
  DeleteGlossaryTermHandler,
  ListGlossaryTermsHandler,
  UpdateGlossaryTermHandler,
} from './application/handlers/glossary.handlers';
import {
  ApplyGlossaryPresetHandler,
  ListGlossaryPresetsHandler,
} from './application/handlers/glossary-preset.handlers';
import { CopyGlossaryFromProjectHandler } from './application/handlers/copy-glossary-from-project.handler';
import {
  AnalyzeGlossaryHandler,
  ApproveGlossarySuggestionHandler,
  ListGlossarySuggestionsHandler,
  RejectGlossarySuggestionHandler,
} from './application/handlers/glossary-suggestion.handlers';
import { GlossaryService } from './application/glossary.service';
import { GlossaryQueueService } from './infrastructure/glossary-queue.service';
import { GlossaryController } from './presentation/glossary.controller';
import { GlossaryPresetsController } from './presentation/glossary-presets.controller';
import { GlossarySuggestionsController } from './presentation/glossary-suggestions.controller';

const commandHandlers = [
  CreateGlossaryTermHandler,
  UpdateGlossaryTermHandler,
  DeleteGlossaryTermHandler,
  ApplyGlossaryPresetHandler,
  CopyGlossaryFromProjectHandler,
  AnalyzeGlossaryHandler,
  ApproveGlossarySuggestionHandler,
  RejectGlossarySuggestionHandler,
];

const queryHandlers = [
  ListGlossaryTermsHandler,
  ListGlossaryPresetsHandler,
  ListGlossarySuggestionsHandler,
];

@Module({
  imports: [CqrsModule, ProjectModule],
  controllers: [
    GlossaryController,
    GlossaryPresetsController,
    GlossarySuggestionsController,
  ],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    GlossaryService,
    GlossaryAnalyzeService,
    GlossaryQueueService,
  ],
  exports: [GlossaryService, GlossaryAnalyzeService],
})
export class GlossaryModule {}
