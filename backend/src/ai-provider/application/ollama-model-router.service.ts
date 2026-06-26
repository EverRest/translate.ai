import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentType } from '../domain/ai-provider.interface';

@Injectable()
export class OllamaModelRouterService {
  constructor(private readonly config: ConfigService) {}

  selectModel(contentType: ContentType, textLength: number): string {
    const literal = this.getModel('OLLAMA_MODEL_LITERAL', 'llama3.1:8b');
    const fast = this.getModel('OLLAMA_MODEL_FAST', 'llama3.1:8b');
    const defaultModel = this.getDefaultModel();

    if (contentType === 'legal' || contentType === 'technical') {
      return literal;
    }

    if (contentType === 'ui' || contentType === 'chat' || textLength < 200) {
      return fast;
    }

    if (
      contentType === 'email' ||
      contentType === 'marketing' ||
      contentType === 'article'
    ) {
      return defaultModel;
    }

    return defaultModel;
  }

  getDefaultModel(): string {
    return this.getModel('OLLAMA_MODEL_DEFAULT', this.getLegacyModel());
  }

  getPolishModel(): string {
    return this.getModel('OLLAMA_POLISH_MODEL', 'llama3.1:8b');
  }

  getClassifierModel(): string {
    return this.getModel('OLLAMA_CLASSIFIER_MODEL', 'llama3.1:8b');
  }

  private getLegacyModel(): string {
    return this.config.get<string>('OLLAMA_MODEL', 'qwen2.5:7b');
  }

  private getModel(key: string, fallback: string): string {
    return this.config.get<string>(key, fallback);
  }
}
