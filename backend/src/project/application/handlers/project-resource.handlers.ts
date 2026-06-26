import { randomBytes, randomUUID } from 'crypto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { isValidLanguageCode } from '../../../shared/utils/string.utils';
import { ProjectAccessService } from '../../infrastructure/project-access.service';
import {
  AddProjectLanguageCommand,
  CreateApiKeyCommand,
  CreateWebhookCommand,
  DeleteWebhookCommand,
  RemoveProjectLanguageCommand,
  RevokeApiKeyCommand,
  UpdateWebhookCommand,
} from '../commands/project.commands';

@Injectable()
@CommandHandler(CreateApiKeyCommand)
export class CreateApiKeyHandler implements ICommandHandler<CreateApiKeyCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: CreateApiKeyCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const id = randomUUID();
    const secret = `ta_live_${id}_${randomBytes(24).toString('hex')}`;
    const secretHash = await argon2.hash(secret);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        id,
        projectId: command.projectId,
        name: command.name,
        secretHash,
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      secret,
      active: apiKey.active,
    };
  }
}

@Injectable()
@CommandHandler(RevokeApiKeyCommand)
export class RevokeApiKeyHandler implements ICommandHandler<RevokeApiKeyCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: RevokeApiKeyCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    await this.prisma.apiKey.updateMany({
      where: { id: command.apiKeyId, projectId: command.projectId },
      data: { active: false },
    });

    return { revoked: true };
  }
}

@Injectable()
@CommandHandler(AddProjectLanguageCommand)
export class AddProjectLanguageHandler implements ICommandHandler<AddProjectLanguageCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: AddProjectLanguageCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const code = command.code.toLowerCase();
    if (!isValidLanguageCode(code)) {
      throw new BadRequestException('Invalid language code');
    }

    try {
      const language = await this.prisma.projectLanguage.create({
        data: {
          projectId: command.projectId,
          code,
        },
      });
      return language;
    } catch {
      throw new ConflictException('Language already configured for project');
    }
  }
}

@Injectable()
@CommandHandler(RemoveProjectLanguageCommand)
export class RemoveProjectLanguageHandler implements ICommandHandler<RemoveProjectLanguageCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: RemoveProjectLanguageCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    await this.prisma.projectLanguage.deleteMany({
      where: { id: command.languageId, projectId: command.projectId },
    });

    return { removed: true };
  }
}

@Injectable()
@CommandHandler(CreateWebhookCommand)
export class CreateWebhookHandler implements ICommandHandler<CreateWebhookCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: CreateWebhookCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const secret = command.secret ?? `whsec_${randomBytes(24).toString('hex')}`;

    const webhook = await this.prisma.webhook.create({
      data: {
        projectId: command.projectId,
        url: command.url,
        secret,
        enabled: command.enabled,
      },
    });

    return {
      id: webhook.id,
      url: webhook.url,
      secret,
      enabled: webhook.enabled,
    };
  }
}

@Injectable()
@CommandHandler(UpdateWebhookCommand)
export class UpdateWebhookHandler implements ICommandHandler<UpdateWebhookCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: UpdateWebhookCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const existing = await this.prisma.webhook.findFirst({
      where: { id: command.webhookId, projectId: command.projectId },
    });
    if (!existing) {
      throw new BadRequestException('Webhook not found');
    }

    return this.prisma.webhook.update({
      where: { id: command.webhookId },
      data: {
        ...(command.url !== undefined ? { url: command.url } : {}),
        ...(command.enabled !== undefined ? { enabled: command.enabled } : {}),
      },
      select: { id: true, url: true, enabled: true },
    });
  }
}

@Injectable()
@CommandHandler(DeleteWebhookCommand)
export class DeleteWebhookHandler implements ICommandHandler<DeleteWebhookCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: DeleteWebhookCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const result = await this.prisma.webhook.deleteMany({
      where: { id: command.webhookId, projectId: command.projectId },
    });
    if (result.count === 0) {
      throw new BadRequestException('Webhook not found');
    }

    return { deleted: true };
  }
}
