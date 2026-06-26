import { Injectable } from '@nestjs/common';
import { AiProvider, TranslateOptions } from '../domain/ai-provider.interface';
import { ContentClassifierService } from '../application/content-classifier.service';
import { OllamaModelRouterService } from '../application/ollama-model-router.service';
import {
  buildTranslationPrompts,
  ProviderTranslateResult,
} from './prompt.builder';
import { OllamaClient } from './ollama.client';
import { OllamaPolishService } from './ollama-polish.service';

@Injectable()
export class OllamaProvider implements AiProvider {
  constructor(
    private readonly client: OllamaClient,
    private readonly classifier: ContentClassifierService,
    private readonly router: OllamaModelRouterService,
    private readonly polish: OllamaPolishService,
  ) {}

  async translate(
    text: string,
    sourceLang: string,
    targetLang: string,
    options?: TranslateOptions,
  ): Promise<ProviderTranslateResult> {
    const contentType = await this.classifier.classify(text, options);
    const model = this.router.selectModel(contentType, text.length);

    const { systemPrompt, userPrompt } = buildTranslationPrompts(
      text,
      sourceLang,
      targetLang,
      { ...options, contentType },
    );
    const prompt = `${systemPrompt}\n\n${userPrompt}`;

    const primary = await this.client.generate(model, prompt);
    let resultText = primary.text;
    let inputTokens = primary.promptTokens;
    let outputTokens = primary.outputTokens;
    let usageModel = model;

    if (this.polish.isEnabled() && this.polish.shouldPolish(contentType)) {
      const polishModel = this.router.getPolishModel();
      const polished = await this.polish.polish(
        resultText,
        targetLang,
        contentType,
        polishModel,
      );
      resultText = polished.text;
      inputTokens += polished.inputTokens;
      outputTokens += polished.outputTokens;
      usageModel = `${model}+polish`;
    }

    return {
      text: resultText,
      usage: {
        model: usageModel,
        inputTokens,
        outputTokens,
        estimatedCostUsd: 0,
      },
    };
  }
}
