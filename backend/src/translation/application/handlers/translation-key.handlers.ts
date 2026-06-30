import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import {
  CreateTranslationKeyCommand,
  DeleteTranslationKeyCommand,
  UpdateTranslationKeyCommand,
} from '../translation-key.commands';

@Injectable()
@CommandHandler(CreateTranslationKeyCommand)
export class CreateTranslationKeyHandler implements ICommandHandler<CreateTranslationKeyCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: CreateTranslationKeyCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    try {
      return await this.prisma.translationKey.create({
        data: {
          projectId: command.projectId,
          key: command.key,
          sourceText: command.sourceText,
          description: command.description,
          context: command.context,
          contentType: command.contentType,
        },
      });
    } catch {
      throw new ConflictException('Translation key already exists');
    }
  }
}

@Injectable()
@CommandHandler(UpdateTranslationKeyCommand)
export class UpdateTranslationKeyHandler implements ICommandHandler<UpdateTranslationKeyCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: UpdateTranslationKeyCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const existing = await this.prisma.translationKey.findFirst({
      where: { id: command.keyId, projectId: command.projectId },
    });
    if (!existing) {
      throw new NotFoundException('Translation key not found');
    }

    return this.prisma.translationKey.update({
      where: { id: command.keyId },
      data: {
        description: command.description,
        context: command.context,
        ...(command.contentType !== undefined
          ? { contentType: command.contentType }
          : {}),
      },
    });
  }
}

@Injectable()
@CommandHandler(DeleteTranslationKeyCommand)
export class DeleteTranslationKeyHandler implements ICommandHandler<DeleteTranslationKeyCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: DeleteTranslationKeyCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const result = await this.prisma.translationKey.deleteMany({
      where: { id: command.keyId, projectId: command.projectId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Translation key not found');
    }
    return { deleted: true };
  }
}
