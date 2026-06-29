import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LocalizationObjectGenerationStatus } from '@prisma/client';
import { AiCompletionService } from '../../../ai-provider/application/ai-completion.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  buildStructureGenerationPrompt,
  parseStructureJson,
} from '../../domain/structure-generate.utils';
import { applyStructureTree } from './apply-structure-tree.service';

@Injectable()
export class StructureGenerateService {
  private readonly logger = new Logger(StructureGenerateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly completion: AiCompletionService,
  ) {}

  async run(projectId: string, objectId: string): Promise<number> {
    const object = await this.prisma.localizationObject.findFirst({
      where: { id: objectId, projectId },
    });
    if (!object) {
      throw new NotFoundException('Localization object not found');
    }

    await this.prisma.localizationObject.update({
      where: { id: objectId },
      data: { generationStatus: 'generating', generationError: null },
    });

    try {
      const prompt = buildStructureGenerationPrompt({
        name: object.name,
        slug: object.slug,
        description: object.description,
        templateType: object.templateType,
      });

      const raw = await this.completion.complete(prompt.system, prompt.user);
      const nodes = parseStructureJson(raw);
      await applyStructureTree(this.prisma, objectId, nodes);

      this.logger.log(
        `Generated ${nodes.length} root nodes for object ${objectId}`,
      );
      return nodes.length;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Generation failed';
      await this.prisma.localizationObject.update({
        where: { id: objectId },
        data: {
          generationStatus: LocalizationObjectGenerationStatus.failed,
          generationError: message.slice(0, 500),
        },
      });
      throw error;
    }
  }
}
