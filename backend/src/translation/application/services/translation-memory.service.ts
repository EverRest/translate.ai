import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { translationMemoryHash } from '../../../shared/utils/hash.utils';
import { formatPgVector } from '../utils/embedding.utils';

export interface StoreTranslationMemoryInput {
  tenantId: string;
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  translatedText: string;
  embedding?: number[];
}

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

  async store(input: StoreTranslationMemoryInput): Promise<string> {
    const hash = translationMemoryHash(
      input.sourceText,
      input.sourceLang,
      input.targetLang,
    );
    const entry = await this.prisma.translationMemory.upsert({
      where: { tenantId_hash: { tenantId: input.tenantId, hash } },
      create: {
        tenantId: input.tenantId,
        sourceLanguage: input.sourceLang,
        targetLanguage: input.targetLang,
        sourceText: input.sourceText,
        translatedText: input.translatedText,
        hash,
      },
      update: {
        translatedText: input.translatedText,
        sourceText: input.sourceText,
        embeddedAt: input.embedding ? new Date() : undefined,
      },
      select: { id: true },
    });

    if (input.embedding) {
      const vector = formatPgVector(input.embedding);
      await this.prisma.$executeRaw`
        UPDATE translation_memory
        SET embedding = ${vector}::vector,
            embedded_at = NOW()
        WHERE id = ${entry.id}::uuid
      `;
    }

    return entry.id;
  }

  async forget(
    tenantId: string,
    sourceText: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<void> {
    const hash = translationMemoryHash(sourceText, sourceLang, targetLang);
    await this.prisma.translationMemory.deleteMany({
      where: { tenantId, hash },
    });
  }
}
