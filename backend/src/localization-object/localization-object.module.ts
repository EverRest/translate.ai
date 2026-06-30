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
import {
  CreateEntityCollectionHandler,
  DeleteEntityCollectionHandler,
  ImportOpenApiHandler,
  ListEntityCollectionsHandler,
  PreviewOpenApiImportHandler,
  UpdateEntityCollectionHandler,
} from './application/handlers/entity-collection.handlers';
import { MaterializeObjectService } from './application/services/materialize-object.service';
import { StructureGenerateService } from './application/services/structure-generate.service';
import { LocalizationObjectQueueService } from './infrastructure/localization-object-queue.service';
import { OpenApiImportQueueService } from './infrastructure/openapi-import-queue.service';
import { LocalizationObjectsController } from './presentation/localization-objects.controller';
import { EntityCollectionsController } from './presentation/entity-collections.controller';

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
  CreateEntityCollectionHandler,
  UpdateEntityCollectionHandler,
  DeleteEntityCollectionHandler,
  ImportOpenApiHandler,
];

const queryHandlers = [
  ListLocalizationObjectsHandler,
  GetLocalizationObjectHandler,
  ListLocalizationObjectTemplatesHandler,
  ListEntityCollectionsHandler,
  PreviewOpenApiImportHandler,
];

const services = [
  MaterializeObjectService,
  StructureGenerateService,
  LocalizationObjectQueueService,
  OpenApiImportQueueService,
];

@Module({
  imports: [CqrsModule, ProjectModule, AiProviderModule],
  controllers: [LocalizationObjectsController, EntityCollectionsController],
  providers: [...commandHandlers, ...queryHandlers, ...services],
  exports: [...services, StructureGenerateService],
})
export class LocalizationObjectModule {}
