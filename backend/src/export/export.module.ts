import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProjectModule } from '../project/project.module';
import { ExportFormatService } from './application/export-format.service';
import { ExportProjectHandler } from './application/handlers/export-project.handler';
import { ExportController } from './presentation/export.controller';

@Module({
  imports: [CqrsModule, ProjectModule],
  controllers: [ExportController],
  providers: [ExportFormatService, ExportProjectHandler],
})
export class ExportModule {}
