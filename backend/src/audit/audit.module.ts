import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuditService } from './application/audit.service';
import { ListAuditLogsHandler } from './application/handlers/list-audit-logs.handler';
import { AuditController } from './presentation/audit.controller';

@Global()
@Module({
  imports: [CqrsModule],
  controllers: [AuditController],
  providers: [AuditService, ListAuditLogsHandler],
  exports: [AuditService],
})
export class AuditModule {}
