import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProjectModule } from '../project/project.module';
import { GlossaryAnalyzeService } from './application/glossary-analyze.service';
import {
  ApplyGlossaryPresetHandler,
  ListGlossaryPresetsHandler,
} from './application/handlers/glossary-preset.handlers';
import {
  BulkUpsertGlossaryTermsHandler,
  CreateGlossaryTermHandler,
  DeleteGlossaryTermHandler,
  ListGlossaryTermsHandler,
  UpdateGlossaryTermHandler,
  UpsertGlossaryTermHandler,
} from './application/handlers/glossary.handlers';
import {
  ActivateGlossaryHandler,
  CreateGlossaryHandler,
  ListGlossariesHandler,
} from './application/handlers/glossary-set.handlers';
import {
  AnalyzeGlossaryHandler,
  ApproveGlossarySuggestionHandler,
  ListGlossarySuggestionsHandler,
  RejectGlossarySuggestionHandler,
} from './application/handlers/glossary-suggestion.handlers';
import {
  DismissTerminologyIssueHandler,
  ListTerminologyIssuesHandler,
  ResolveTerminologyIssueHandler,
  ScanTerminologyHandler,
} from './application/handlers/terminology-drift.handlers';
import { GlossaryService } from './application/glossary.service';
import { TerminologyDriftService } from './application/terminology-drift.service';
import { GlossaryQueueService } from './infrastructure/glossary-queue.service';
import { TerminologyQueueService } from './infrastructure/terminology-queue.service';
import { GlossaryController } from './presentation/glossary.controller';
import { GlossaryPresetsController } from './presentation/glossary-presets.controller';
import { GlossarySetsController } from './presentation/glossary-sets.controller';
import { GlossarySuggestionsController } from './presentation/glossary-suggestions.controller';
import { TerminologyDriftController } from './presentation/terminology-drift.controller';

const commandHandlers = [
  CreateGlossaryTermHandler,
  UpsertGlossaryTermHandler,
  BulkUpsertGlossaryTermsHandler,
  UpdateGlossaryTermHandler,
  DeleteGlossaryTermHandler,
  CreateGlossaryHandler,
  ActivateGlossaryHandler,
  ApplyGlossaryPresetHandler,
  AnalyzeGlossaryHandler,
  ApproveGlossarySuggestionHandler,
  RejectGlossarySuggestionHandler,
  ScanTerminologyHandler,
  ResolveTerminologyIssueHandler,
  DismissTerminologyIssueHandler,
];

const queryHandlers = [
  ListGlossaryTermsHandler,
  ListGlossarySuggestionsHandler,
  ListGlossariesHandler,
  ListGlossaryPresetsHandler,
  ListTerminologyIssuesHandler,
];

@Module({
  imports: [CqrsModule, ProjectModule],
  controllers: [
    GlossaryController,
    GlossarySetsController,
    GlossaryPresetsController,
    GlossarySuggestionsController,
    TerminologyDriftController,
  ],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    GlossaryService,
    GlossaryAnalyzeService,
    TerminologyDriftService,
    GlossaryQueueService,
    TerminologyQueueService,
  ],
  exports: [GlossaryService, GlossaryAnalyzeService, TerminologyDriftService],
})
export class GlossaryModule {}
