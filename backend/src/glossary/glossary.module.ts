import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProjectModule } from '../project/project.module';
import {
  CreateGlossaryTermHandler,
  DeleteGlossaryTermHandler,
  ListGlossaryTermsHandler,
  UpdateGlossaryTermHandler,
} from './application/handlers/glossary.handlers';
import { GlossaryService } from './application/glossary.service';
import { GlossaryController } from './presentation/glossary.controller';

const commandHandlers = [
  CreateGlossaryTermHandler,
  UpdateGlossaryTermHandler,
  DeleteGlossaryTermHandler,
];

const queryHandlers = [ListGlossaryTermsHandler];

@Module({
  imports: [CqrsModule, ProjectModule],
  controllers: [GlossaryController],
  providers: [...commandHandlers, ...queryHandlers, GlossaryService],
  exports: [GlossaryService],
})
export class GlossaryModule {}
