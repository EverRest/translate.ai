import { Injectable } from '@nestjs/common';
import { GlossaryTermOption } from '../../ai-provider/domain/ai-provider.interface';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { GlossaryPresetTerm } from '../domain/glossary-presets';

@Injectable()
export class GlossaryService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureGlossary(projectId: string) {
    return this.prisma.glossary.upsert({
      where: { projectId },
      create: { projectId },
      update: {},
    });
  }

  async getTermsForProject(projectId: string): Promise<GlossaryTermOption[]> {
    const glossary = await this.prisma.glossary.findUnique({
      where: { projectId },
      include: { terms: { orderBy: { sourceTerm: 'asc' } } },
    });

    if (!glossary) {
      return [];
    }

    return glossary.terms.map((term) => ({
      sourceTerm: term.sourceTerm,
      targetTerm: term.targetTerm,
      doNotTranslate: term.doNotTranslate,
    }));
  }

  async applyPresetTerms(glossaryId: string, terms: GlossaryPresetTerm[]) {
    const existing = await this.prisma.glossaryTerm.findMany({
      where: { glossaryId },
      select: { sourceTerm: true },
    });
    const existingTerms = new Set(
      existing.map((term) => term.sourceTerm.toLowerCase()),
    );

    const toCreate = terms.filter(
      (term) => !existingTerms.has(term.sourceTerm.trim().toLowerCase()),
    );

    if (toCreate.length > 0) {
      await this.prisma.glossaryTerm.createMany({
        data: toCreate.map((term) => ({
          glossaryId,
          sourceTerm: term.sourceTerm.trim(),
          targetTerm: term.doNotTranslate
            ? null
            : term.targetTerm?.trim() || null,
          doNotTranslate: term.doNotTranslate ?? false,
          note: term.note?.trim() || null,
        })),
        skipDuplicates: true,
      });
    }

    return {
      added: toCreate.length,
      skipped: terms.length - toCreate.length,
    };
  }

  async copyTermsFromProject(sourceProjectId: string, targetProjectId: string) {
    const sourceGlossary = await this.prisma.glossary.findUnique({
      where: { projectId: sourceProjectId },
      include: { terms: true },
    });

    if (!sourceGlossary || sourceGlossary.terms.length === 0) {
      return { added: 0, skipped: 0 };
    }

    const targetGlossary = await this.ensureGlossary(targetProjectId);

    return this.applyPresetTerms(
      targetGlossary.id,
      sourceGlossary.terms.map((term) => ({
        sourceTerm: term.sourceTerm,
        targetTerm: term.targetTerm ?? undefined,
        doNotTranslate: term.doNotTranslate,
        note: term.note ?? undefined,
      })),
    );
  }
}
