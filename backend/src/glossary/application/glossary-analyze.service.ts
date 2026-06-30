import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GlossarySuggestionStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  mergeSuggestionCandidates,
  mineGlossarySuggestions,
  type TranslationCorpusRow,
} from './glossary-suggestion.utils';

@Injectable()
export class GlossaryAnalyzeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  minTranslations(): number {
    return this.config.get<number>('GLOSSARY_ANALYZE_MIN_TRANSLATIONS', 100);
  }

  maxSuggestions(): number {
    return this.config.get<number>('GLOSSARY_ANALYZE_MAX_SUGGESTIONS', 50);
  }

  async countTranslations(projectId: string): Promise<number> {
    return this.prisma.translation.count({
      where: { translationKey: { projectId } },
    });
  }

  async run(projectId: string): Promise<number> {
    const rows = await this.loadCorpus(projectId);
    const existingTerms = await this.prisma.glossaryTerm.findMany({
      where: { glossary: { projectId } },
      select: { sourceTerm: true },
    });

    const suggestions = mergeSuggestionCandidates(
      mineGlossarySuggestions(rows),
      existingTerms.map((term) => term.sourceTerm),
    ).slice(0, this.maxSuggestions());

    await this.prisma.glossarySuggestion.deleteMany({
      where: { projectId, status: GlossarySuggestionStatus.pending },
    });

    if (suggestions.length === 0) {
      return 0;
    }

    await this.prisma.glossarySuggestion.createMany({
      data: suggestions.map((suggestion) => ({
        projectId,
        sourceTerm: suggestion.sourceTerm,
        targetTerm: suggestion.targetTerm ?? null,
        doNotTranslate: suggestion.doNotTranslate,
        confidence: suggestion.confidence,
        reason: suggestion.reason,
        status: GlossarySuggestionStatus.pending,
      })),
    });

    return suggestions.length;
  }

  private async loadCorpus(projectId: string): Promise<TranslationCorpusRow[]> {
    const keys = await this.prisma.translationKey.findMany({
      where: { projectId },
      include: {
        translations: {
          select: { language: true, value: true },
        },
      },
    });

    return keys.map((key) => ({
      key: key.key,
      sourceText: key.sourceText,
      translations: key.translations,
    }));
  }
}
