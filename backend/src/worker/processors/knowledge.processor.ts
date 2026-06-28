import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { KnowledgeIngestService } from '../../knowledge/application/knowledge-ingest.service';
import { KnowledgeIngestJobPayload } from '../../shared/constants/job-payloads';
import { QUEUES } from '../../shared/constants/queues';

@Processor(QUEUES.KNOWLEDGE_INGEST)
export class KnowledgeIngestProcessor extends WorkerHost {
  private readonly logger = new Logger(KnowledgeIngestProcessor.name);

  constructor(private readonly ingestService: KnowledgeIngestService) {
    super();
  }

  async process(job: Job<KnowledgeIngestJobPayload>): Promise<void> {
    this.logger.log(
      `Processing ${QUEUES.KNOWLEDGE_INGEST} for source ${job.data.sourceId}`,
    );
    const created = await this.ingestService.run(job.data.sourceId);
    this.logger.log(`Ingested ${created} knowledge chunks`);
  }
}
