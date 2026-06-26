import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BillingModule } from '../billing/billing.module';
import { ProjectModule } from '../project/project.module';
import {
  ApproveTranslationHandler,
  BulkApproveTranslationsHandler,
  ListProjectReviewsHandler,
  PublishTranslationHandler,
  RejectTranslationHandler,
  UpdateTranslationValueHandler,
} from './application/handlers/approval.handlers';
import { TranslationAccessService } from './infrastructure/translation-access.service';
import { ApprovalController } from './presentation/approval.controller';

const handlers = [
  ListProjectReviewsHandler,
  ApproveTranslationHandler,
  RejectTranslationHandler,
  PublishTranslationHandler,
  UpdateTranslationValueHandler,
  BulkApproveTranslationsHandler,
];

@Module({
  imports: [CqrsModule, ProjectModule, BillingModule],
  controllers: [ApprovalController],
  providers: [TranslationAccessService, ...handlers],
  exports: [TranslationAccessService],
})
export class ApprovalModule {}
