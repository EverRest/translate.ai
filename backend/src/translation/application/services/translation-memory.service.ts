import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { translationMemoryHash } from '../../../shared/utils/hash.utils';

@Injectable()
export class TranslationMemoryService {
  constructor(private readonly prisma: PrismaService) {}

  async lookup(
    tenantId: string,
    sourceText: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<string | null> {
    const hash = translationMemoryHash(sourceText, sourceLang, targetLang);
    const entry = await this.prisma.translationMemory.findUnique({
      where: { tenantId_hash: { tenantId, hash } },
    });
    return entry?.translatedText ?? null;
  }

  async store(
    tenantId: string,
    sourceText: string,
    sourceLang: string,
    targetLang: string,
    translatedText: string,
  ): Promise<void> {
    const hash = translationMemoryHash(sourceText, sourceLang, targetLang);
    await this.prisma.translationMemory.upsert({
      where: { tenantId_hash: { tenantId, hash } },
      create: {
        tenantId,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        sourceText,
        translatedText,
        hash,
      },
      update: { translatedText, sourceText },
    });
  }
}
