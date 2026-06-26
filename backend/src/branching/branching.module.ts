import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuditModule } from '../audit/audit.module';
import { ProjectModule } from '../project/project.module';
import {
  CreateBranchHandler,
  GetBranchDiffHandler,
  ListBranchesHandler,
  MergeBranchHandler,
  UpdateBranchTranslationHandler,
} from './application/handlers/branching.handlers';
import { BranchingService } from './application/branching.service';
import { BranchingController } from './presentation/branching.controller';

const commandHandlers = [
  CreateBranchHandler,
  UpdateBranchTranslationHandler,
  MergeBranchHandler,
];

const queryHandlers = [ListBranchesHandler, GetBranchDiffHandler];

@Module({
  imports: [CqrsModule, ProjectModule, AuditModule],
  controllers: [BranchingController],
  providers: [...commandHandlers, ...queryHandlers, BranchingService],
  exports: [BranchingService],
})
export class BranchingModule {}
