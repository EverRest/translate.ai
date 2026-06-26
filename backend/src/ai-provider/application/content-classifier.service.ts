import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentType, TranslateOptions } from '../domain/ai-provider.interface';
import { OllamaClient } from '../infrastructure/ollama.client';
import { OllamaModelRouterService } from './ollama-model-router.service';
import {
  buildClassifierPrompt,
  inferContentTypeFromOptions,
  parseClassifierLabel,
} from './content-classifier.utils';

export type RoutingMode = 'rules' | 'classifier' | 'rules_then_classifier';

@Injectable()
export class ContentClassifierService {
  private readonly logger = new Logger(ContentClassifierService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly client: OllamaClient,
    private readonly router: OllamaModelRouterService,
  ) {}

  async classify(
    text: string,
    options?: TranslateOptions,
  ): Promise<ContentType> {
    const mode = this.getRoutingMode();
    const ruleBased = inferContentTypeFromOptions(text, options);

    if (mode === 'rules') {
      return ruleBased;
    }

    if (mode === 'rules_then_classifier') {
      if (ruleBased !== 'general') {
        return ruleBased;
      }
      const aiLabel = await this.classifyWithAi(text, options?.context);
      return aiLabel ?? ruleBased;
    }

    const aiLabel = await this.classifyWithAi(text, options?.context);
    if (aiLabel) {
      this.logger.debug(`AI classifier label: ${aiLabel}`);
      return aiLabel;
    }

    return ruleBased;
  }

  private getRoutingMode(): RoutingMode {
    return this.config.get<RoutingMode>('OLLAMA_ROUTING_MODE', 'rules');
  }

  private async classifyWithAi(
    text: string,
    context?: string,
  ): Promise<ContentType | undefined> {
    try {
      const model = this.router.getClassifierModel();
      const prompt = buildClassifierPrompt(text, context);
      const result = await this.client.generate(model, prompt, 30_000);
      return parseClassifierLabel(result.text);
    } catch (error) {
      this.logger.warn(
        `Classifier failed, using rules: ${error instanceof Error ? error.message : error}`,
      );
      return undefined;
    }
  }
}
