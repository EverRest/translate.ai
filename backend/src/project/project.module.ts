import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ArchiveProjectHandler } from './application/handlers/archive-project.handler';
import { CreateProjectHandler } from './application/handlers/create-project.handler';
import {
  GetProjectHandler,
  ListProjectsHandler,
} from './application/handlers/project-query.handlers';
import {
  ListApiKeysHandler,
  ListProjectLanguagesHandler,
  ListWebhooksHandler,
} from './application/handlers/project-resource-query.handlers';
import {
  AddProjectLanguageHandler,
  CreateApiKeyHandler,
  CreateWebhookHandler,
  DeleteWebhookHandler,
  RemoveProjectLanguageHandler,
  RevokeApiKeyHandler,
  UpdateWebhookHandler,
} from './application/handlers/project-resource.handlers';
import { UpdateProjectHandler } from './application/handlers/update-project.handler';
import { ProjectAccessService } from './infrastructure/project-access.service';
import { ProjectResourcesController } from './presentation/project-resources.controller';
import { ProjectsController } from './presentation/projects.controller';

const commandHandlers = [
  CreateProjectHandler,
  UpdateProjectHandler,
  ArchiveProjectHandler,
  CreateApiKeyHandler,
  RevokeApiKeyHandler,
  AddProjectLanguageHandler,
  RemoveProjectLanguageHandler,
  CreateWebhookHandler,
  UpdateWebhookHandler,
  DeleteWebhookHandler,
];

const queryHandlers = [
  ListProjectsHandler,
  GetProjectHandler,
  ListApiKeysHandler,
  ListProjectLanguagesHandler,
  ListWebhooksHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [ProjectsController, ProjectResourcesController],
  providers: [ProjectAccessService, ...commandHandlers, ...queryHandlers],
  exports: [ProjectAccessService],
})
export class ProjectModule {}
