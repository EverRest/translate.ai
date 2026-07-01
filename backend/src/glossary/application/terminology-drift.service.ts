import { Injectable } from '@nestjs/common';
import { TerminologyDriftIssueStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  detectTerminologyDrift,
  type DriftVariant,
  type TerminologyCorpusRow,
} from './terminology-drift.utils';

export type TerminologyDriftIssueDto = {
  id: string;
  sourceTerm: string;
  targetLang: string;
  variants: DriftVariant[];
  status: TerminologyDriftIssueStatus;
  canonicalTranslation: string | null;
  detectedAt: Date;
  resolvedAt: Date | null;
};

@Injectable()
export class TerminologyDriftService {
  constructor(private readonly prisma: PrismaService) {}

  async runScan(projectId: string): Promise<number> {
    const rows = await this.loadCorpus(projectId);
    const detected = detectTerminologyDrift(rows);
    const existingGlossary = await this.prisma.glossaryTerm.findMany({
      where: { glossary: { projectId } },
      select: { sourceTerm: true },
    });
    const glossaryTerms = new Set(
      existingGlossary.map((term) => term.sourceTerm.trim().toLowerCase()),
    );

    let createdOrUpdated = 0;

    for (const issue of detected) {
      if (glossaryTerms.has(issue.sourceTerm.trim().toLowerCase())) {
        continue;
      }

      await this.prisma.terminologyDriftIssue.upsert({
        where: {
          projectId_sourceTerm_targetLang: {
            projectId,
            sourceTerm: issue.sourceTerm,
            targetLang: issue.targetLang,
          },
        },
        create: {
          projectId,
          sourceTerm: issue.sourceTerm,
          targetLang: issue.targetLang,
          variants: issue.variants,
          status: TerminologyDriftIssueStatus.open,
        },
        update: {
          variants: issue.variants,
          status: TerminologyDriftIssueStatus.open,
          resolvedAt: null,
          canonicalTranslation: null,
          detectedAt: new Date(),
        },
      });
      createdOrUpdated += 1;
    }

    return createdOrUpdated;
  }

  async countOpenIssues(projectId: string): Promise<number> {
    return this.prisma.terminologyDriftIssue.count({
      where: { projectId, status: TerminologyDriftIssueStatus.open },
    });
  }

  async listOpenIssues(projectId: string): Promise<TerminologyDriftIssueDto[]> {
    const items = await this.prisma.terminologyDriftIssue.findMany({
      where: { projectId, status: TerminologyDriftIssueStatus.open },
      orderBy: [{ detectedAt: 'desc' }, { sourceTerm: 'asc' }],
    });
    return items.map((item) => this.mapIssue(item));
  }

  async getKeysInOpenIssues(projectId: string): Promise<string[]> {
    const issues = await this.prisma.terminologyDriftIssue.findMany({
      where: { projectId, status: TerminologyDriftIssueStatus.open },
      select: { variants: true },
    });

    const keys = new Set<string>();
    for (const issue of issues) {
      const variants = issue.variants as DriftVariant[];
      for (const variant of variants) {
        for (const key of variant.keys) {
          keys.add(key);
        }
      }
    }
    return [...keys];
  }

  mapIssue(issue: {
    id: string;
    sourceTerm: string;
    targetLang: string;
    variants: unknown;
    status: TerminologyDriftIssueStatus;
    canonicalTranslation: string | null;
    detectedAt: Date;
    resolvedAt: Date | null;
  }): TerminologyDriftIssueDto {
    return {
      id: issue.id,
      sourceTerm: issue.sourceTerm,
      targetLang: issue.targetLang,
      variants: issue.variants as DriftVariant[],
      status: issue.status,
      canonicalTranslation: issue.canonicalTranslation,
      detectedAt: issue.detectedAt,
      resolvedAt: issue.resolvedAt,
    };
  }

  private async loadCorpus(projectId: string): Promise<TerminologyCorpusRow[]> {
    const keys = await this.prisma.translationKey.findMany({
      where: { projectId },
      include: {
        translations: {
          select: { language: true, value: true },
        },
      },
    });

    return keys.map((key) => ({
      keyId: key.id,
      key: key.key,
      sourceText: key.sourceText,
      translations: key.translations,
    }));
  }
}
