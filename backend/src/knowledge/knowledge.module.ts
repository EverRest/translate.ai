import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiProviderModule } from '../ai-provider/ai-provider.module';
import { ProjectModule } from '../project/project.module';
import { KnowledgeIngestService } from './application/knowledge-ingest.service';
import {
  CreateKnowledgeSourceHandler,
  DeleteKnowledgeSourceHandler,
  ListKnowledgeSourcesHandler,
} from './application/handlers/knowledge.handlers';
import { RagRetrievalService } from './application/rag-retrieval.service';
import { KnowledgeQueueService } from './infrastructure/knowledge-queue.service';
import { KnowledgeController } from './presentation/knowledge.controller';

const commandHandlers = [
  CreateKnowledgeSourceHandler,
  DeleteKnowledgeSourceHandler,
];

const queryHandlers = [ListKnowledgeSourcesHandler];

@Module({
  imports: [CqrsModule, ProjectModule, AiProviderModule],
  controllers: [KnowledgeController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    KnowledgeIngestService,
    RagRetrievalService,
    KnowledgeQueueService,
  ],
  exports: [RagRetrievalService, KnowledgeIngestService],
})
export class KnowledgeModule {}
