import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiProviderModule } from '../ai-provider/ai-provider.module';
import { ProjectModule } from '../project/project.module';
import {
  ApplyLocalizationObjectTemplateHandler,
  CreateLocalizationNodeHandler,
  CreateLocalizationObjectHandler,
  DeleteLocalizationNodeHandler,
  DeleteLocalizationObjectHandler,
  GenerateLocalizationObjectStructureHandler,
  GetLocalizationObjectHandler,
  ListLocalizationObjectTemplatesHandler,
  ListLocalizationObjectsHandler,
  MaterializeLocalizationObjectHandler,
  TranslateLocalizationObjectHandler,
  UpdateLocalizationNodeHandler,
  UpdateLocalizationObjectHandler,
} from './application/handlers/localization-object.handlers';
import { MaterializeObjectService } from './application/services/materialize-object.service';
import { StructureGenerateService } from './application/services/structure-generate.service';
import { LocalizationObjectQueueService } from './infrastructure/localization-object-queue.service';
import { LocalizationObjectsController } from './presentation/localization-objects.controller';

const commandHandlers = [
  CreateLocalizationObjectHandler,
  UpdateLocalizationObjectHandler,
  DeleteLocalizationObjectHandler,
  CreateLocalizationNodeHandler,
  UpdateLocalizationNodeHandler,
  DeleteLocalizationNodeHandler,
  MaterializeLocalizationObjectHandler,
  TranslateLocalizationObjectHandler,
  GenerateLocalizationObjectStructureHandler,
  ApplyLocalizationObjectTemplateHandler,
];

const queryHandlers = [
  ListLocalizationObjectsHandler,
  GetLocalizationObjectHandler,
  ListLocalizationObjectTemplatesHandler,
];

const services = [
  MaterializeObjectService,
  StructureGenerateService,
  LocalizationObjectQueueService,
];

@Module({
  imports: [CqrsModule, ProjectModule, AiProviderModule],
  controllers: [LocalizationObjectsController],
  providers: [...commandHandlers, ...queryHandlers, ...services],
  exports: [...services, StructureGenerateService],
})
export class LocalizationObjectModule {}
