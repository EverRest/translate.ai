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
  AnalyzeGlossaryHandler,
  ApproveGlossarySuggestionHandler,
  ListGlossarySuggestionsHandler,
  RejectGlossarySuggestionHandler,
} from './application/handlers/glossary-suggestion.handlers';
import { GlossaryService } from './application/glossary.service';
import { GlossaryQueueService } from './infrastructure/glossary-queue.service';
import { GlossaryController } from './presentation/glossary.controller';
import { GlossarySuggestionsController } from './presentation/glossary-suggestions.controller';

const commandHandlers = [
  CreateGlossaryTermHandler,
  UpdateGlossaryTermHandler,
  DeleteGlossaryTermHandler,
  AnalyzeGlossaryHandler,
  ApproveGlossarySuggestionHandler,
  RejectGlossarySuggestionHandler,
];

const queryHandlers = [
  ListGlossaryTermsHandler,
  ListGlossarySuggestionsHandler,
];

@Module({
  imports: [CqrsModule, ProjectModule],
  controllers: [GlossaryController, GlossarySuggestionsController],
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
