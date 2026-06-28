import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AiProviderModule } from './ai-provider/ai-provider.module';
import { ApprovalModule } from './approval/approval.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { BranchingModule } from './branching/branching.module';
import { ExportModule } from './export/export.module';
import { GlossaryModule } from './glossary/glossary.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { ProjectModule } from './project/project.module';
import { SharedModule } from './shared/shared.module';
import { HealthModule } from './shared/health/health.module';
import { MonitoringModule } from './shared/monitoring/monitoring.module';
import { TenantModule } from './tenant/tenant.module';
import { TranslationModule } from './translation/translation.module';
import { UserModule } from './user/user.module';
import { WebhookModule } from './webhook/webhook.module';
import { QueuesModule } from './shared/queues/queues.module';
import { validationSchema } from './shared/config/validation.schema';
import { CombinedAuthGuard } from './shared/auth/guards/combined-auth.guard';
import { ApiKeyAccessGuard } from './shared/auth/guards/api-key-access.guard';
import { RolesGuard } from './shared/auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    CqrsModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    QueuesModule,
    AdminModule,
    SharedModule,
    MonitoringModule,
    HealthModule,
    AuthModule,
    TenantModule,
    UserModule,
    ProjectModule,
    TranslationModule,
    AiProviderModule,
    WebhookModule,
    ApprovalModule,
    ExportModule,
    AuditModule,
    BillingModule,
    GlossaryModule,
    KnowledgeModule,
    BranchingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CombinedAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ApiKeyAccessGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
