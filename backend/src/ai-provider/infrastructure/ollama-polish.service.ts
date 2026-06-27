import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentType } from '../domain/ai-provider.interface';
import { OllamaClient } from './ollama.client';

@Injectable()
export class OllamaPolishService {
  constructor(
    private readonly config: ConfigService,
    private readonly client: OllamaClient,
  ) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('OLLAMA_POLISH_ENABLED', false);
  }

  shouldPolish(contentType: ContentType): boolean {
    return contentType !== 'legal' && contentType !== 'technical';
  }

  async polish(
    translation: string,
    targetLang: string,
    contentType: ContentType,
    polishModel: string,
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const prompt = `You are a professional editor. Improve the fluency and natural flow of this ${targetLang} translation.
Keep the exact meaning. Do not add explanations. Return only the polished text without surrounding quotation marks.
Content type: ${contentType}

Translation:
${translation}`;

    const result = await this.client.generate(polishModel, prompt);
    return {
      text: result.text,
      inputTokens: result.promptTokens,
      outputTokens: result.outputTokens,
    };
  }
}
