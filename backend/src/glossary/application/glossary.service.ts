import { Injectable } from '@nestjs/common';
import { GlossaryTermOption } from '../../ai-provider/domain/ai-provider.interface';
import { PrismaService } from '../../shared/prisma/prisma.service';

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
}
