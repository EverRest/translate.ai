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
import {
  CountTerminologyDriftIssuesHandler,
  GetTerminologyDriftKeyHintsHandler,
  ListTerminologyDriftIssuesHandler,
  ResolveTerminologyDriftIssueHandler,
  ScanTerminologyDriftHandler,
} from './application/handlers/terminology-drift.handlers';
import { TerminologyScanOnJobCompletedHandler } from './application/handlers/terminology-scan-on-job-completed.handler';
import { GlossaryService } from './application/glossary.service';
import { TerminologyDriftService } from './application/terminology-drift.service';
import { GlossaryQueueService } from './infrastructure/glossary-queue.service';
import { TerminologyQueueService } from './infrastructure/terminology-queue.service';
import { GlossaryController } from './presentation/glossary.controller';
import { GlossaryPresetsController } from './presentation/glossary-presets.controller';
import { GlossarySuggestionsController } from './presentation/glossary-suggestions.controller';
import { TerminologyController } from './presentation/terminology.controller';

const commandHandlers = [
  CreateGlossaryTermHandler,
  UpdateGlossaryTermHandler,
  DeleteGlossaryTermHandler,
  ApplyGlossaryPresetHandler,
  CopyGlossaryFromProjectHandler,
  AnalyzeGlossaryHandler,
  ApproveGlossarySuggestionHandler,
  RejectGlossarySuggestionHandler,
  ScanTerminologyDriftHandler,
  ResolveTerminologyDriftIssueHandler,
];

const queryHandlers = [
  ListGlossaryTermsHandler,
  ListGlossaryPresetsHandler,
  ListGlossarySuggestionsHandler,
  ListTerminologyDriftIssuesHandler,
  CountTerminologyDriftIssuesHandler,
  GetTerminologyDriftKeyHintsHandler,
];

const eventHandlers = [TerminologyScanOnJobCompletedHandler];

@Module({
  imports: [CqrsModule, ProjectModule],
  controllers: [
    GlossaryController,
    GlossaryPresetsController,
    GlossarySuggestionsController,
    TerminologyController,
  ],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
    GlossaryService,
    GlossaryAnalyzeService,
    TerminologyDriftService,
    GlossaryQueueService,
    TerminologyQueueService,
  ],
  exports: [GlossaryService, GlossaryAnalyzeService, TerminologyDriftService],
})
export class GlossaryModule {}
