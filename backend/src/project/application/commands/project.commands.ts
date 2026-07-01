import { DomainProfile } from '../../../shared/domain/domain-profile.types';

export class CreateProjectCommand {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly domainProfile?: DomainProfile | null,
  ) {}
}

export class UpdateProjectCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly domainProfile?: DomainProfile | null,
  ) {}
}

export class ArchiveProjectCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}

export type ProjectSettingsCopyInclude = 'domainProfile' | 'glossary';

export class CopyProjectSettingsCommand {
  constructor(
    public readonly tenantId: string,
    public readonly targetProjectId: string,
    public readonly sourceProjectId: string,
    public readonly include: ProjectSettingsCopyInclude[],
  ) {}
}

export class CreateApiKeyCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly name: string,
  ) {}
}

export class RevokeApiKeyCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly apiKeyId: string,
  ) {}
}

export class AddProjectLanguageCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly code: string,
  ) {}
}

export class RemoveProjectLanguageCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly languageId: string,
  ) {}
}

export class CreateWebhookCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly url: string,
    public readonly secret?: string,
    public readonly enabled = true,
  ) {}
}

export class UpdateWebhookCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly webhookId: string,
    public readonly url?: string,
    public readonly enabled?: boolean,
  ) {}
}

export class DeleteWebhookCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly webhookId: string,
  ) {}
}
