import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { QualityMetricSource } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { scoreToVerdict } from '../../../shared/utils/similarity.utils';
import { RecordTranslationQualityCommand } from '../translation.queries';
import { TranslationQualityService } from '../../../billing/application/translation-quality.service';

@Injectable()
@CommandHandler(RecordTranslationQualityCommand)
export class RecordTranslationQualityHandler implements ICommandHandler<RecordTranslationQualityCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quality: TranslationQualityService,
  ) {}

  async execute(command: RecordTranslationQualityCommand) {
    const translation = await this.prisma.translation.findFirst({
      where: {
        id: command.translationId,
        translationKey: {
          projectId: command.projectId,
          project: { tenantId: command.tenantId },
        },
      },
      include: {
        translationKey: { select: { key: true, sourceText: true } },
      },
    });

    if (!translation) {
      throw new NotFoundException('Translation not found');
    }

    const metric = await this.quality.record({
      tenantId: command.tenantId,
      projectId: command.projectId,
      translationId: translation.id,
      language: translation.language,
      translationKey: translation.translationKey.key,
      sourceText: translation.translationKey.sourceText,
      aiValue: translation.value,
      referenceValue: command.referenceValue,
      score: command.score,
      verdict: scoreToVerdict(command.score),
      source: QualityMetricSource.manual,
      notes: command.notes,
      provider: translation.provider ?? undefined,
      createdById: command.userId,
    });

    return metric;
  }
}
