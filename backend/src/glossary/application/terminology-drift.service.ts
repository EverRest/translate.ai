import { Injectable } from '@nestjs/common';
import {
  TerminologyIssueSeverity,
  TerminologyIssueStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  detectTerminologyDrift,
  type DriftVariant,
} from './terminology-drift.utils';

@Injectable()
export class TerminologyDriftService {
  constructor(private readonly prisma: PrismaService) {}

  async runScan(projectId: string): Promise<{ scanId: string; created: number }> {
    const scanId = randomUUID();
    const rows = await this.loadCorpus(projectId);
    const candidates = detectTerminologyDrift(rows);

    let created = 0;
    for (const candidate of candidates) {
      const existing = await this.prisma.terminologyIssue.findFirst({
        where: {
          projectId,
          sourceTerm: candidate.sourceTerm,
          language: candidate.language,
          status: TerminologyIssueStatus.open,
        },
      });

      if (existing) {
        await this.prisma.terminologyIssue.update({
          where: { id: existing.id },
          data: {
            variants: candidate.variants,
            severity: candidate.severity as TerminologyIssueSeverity,
            scanId,
          },
        });
      } else {
        await this.prisma.terminologyIssue.create({
          data: {
            projectId,
            sourceTerm: candidate.sourceTerm,
            language: candidate.language,
            variants: candidate.variants,
            severity: candidate.severity as TerminologyIssueSeverity,
            scanId,
            status: TerminologyIssueStatus.open,
          },
        });
        created += 1;
      }
    }

    return { scanId, created };
  }

  async listIssues(projectId: string, status?: TerminologyIssueStatus) {
    const items = await this.prisma.terminologyIssue.findMany({
      where: {
        projectId,
        ...(status ? { status } : {}),
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    });

    return items.map((issue) => ({
      id: issue.id,
      sourceTerm: issue.sourceTerm,
      language: issue.language,
      status: issue.status,
      variants: issue.variants as DriftVariant[],
      severity: issue.severity,
      scanId: issue.scanId,
      createdAt: issue.createdAt,
      resolvedAt: issue.resolvedAt,
    }));
  }

  async countOpenIssues(projectId: string): Promise<number> {
    return this.prisma.terminologyIssue.count({
      where: { projectId, status: TerminologyIssueStatus.open },
    });
  }

  private async loadCorpus(projectId: string) {
    const translations = await this.prisma.translation.findMany({
      where: {
        translationKey: { projectId },
        value: { not: '' },
      },
      select: {
        language: true,
        value: true,
        translationKey: {
          select: {
            id: true,
            key: true,
            sourceText: true,
          },
        },
      },
    });

    return translations.map((row) => ({
      keyId: row.translationKey.id,
      key: row.translationKey.key,
      sourceText: row.translationKey.sourceText ?? '',
      language: row.language,
      value: row.value,
    }));
  }
}
