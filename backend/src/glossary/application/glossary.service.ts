import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GlossaryTermOption } from '../../ai-provider/domain/ai-provider.interface';
import { PrismaService } from '../../shared/prisma/prisma.service';

export type UpsertGlossaryTermInput = {
  sourceTerm: string;
  targetTerm?: string | null;
  doNotTranslate?: boolean;
  note?: string | null;
};

export type GlossaryTermRecord = {
  id: string;
  sourceTerm: string;
  targetTerm: string | null;
  doNotTranslate: boolean;
  note: string | null;
};

export type GlossarySetRecord = {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  termCount: number;
  createdAt: Date;
};

type DbClient = PrismaService | Prisma.TransactionClient;

function mapTerm(term: {
  id: string;
  sourceTerm: string;
  targetTerm: string | null;
  doNotTranslate: boolean;
  note: string | null;
}): GlossaryTermRecord {
  return {
    id: term.id,
    sourceTerm: term.sourceTerm,
    targetTerm: term.targetTerm,
    doNotTranslate: term.doNotTranslate,
    note: term.note,
  };
}

function normalizeUpsertInput(input: UpsertGlossaryTermInput) {
  const doNotTranslate = input.doNotTranslate ?? false;
  const sourceTerm = input.sourceTerm.trim();
  const targetTerm = doNotTranslate
    ? null
    : input.targetTerm?.trim() || null;
  const note = input.note?.trim() || null;

  return { sourceTerm, targetTerm, doNotTranslate, note };
}

@Injectable()
export class GlossaryService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaultGlossary(projectId: string, db: DbClient = this.prisma) {
    const existingDefault = await db.glossary.findFirst({
      where: { projectId, isDefault: true },
    });
    if (existingDefault) {
      return existingDefault;
    }

    const anyGlossary = await db.glossary.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
    if (anyGlossary) {
      return anyGlossary;
    }

    return db.glossary.create({
      data: {
        projectId,
        name: 'Default',
        isDefault: true,
        isActive: true,
      },
    });
  }

  async getActiveGlossary(projectId: string, db: DbClient = this.prisma) {
    const active = await db.glossary.findFirst({
      where: { projectId, isActive: true },
    });
    if (active) {
      return active;
    }

    return this.ensureDefaultGlossary(projectId, db);
  }

  /** @deprecated Use getActiveGlossary — kept for call sites during transition */
  async ensureGlossary(projectId: string, db: DbClient = this.prisma) {
    return this.getActiveGlossary(projectId, db);
  }

  async getGlossaryForProject(
    projectId: string,
    glossaryId: string | undefined,
    db: DbClient = this.prisma,
  ) {
    if (glossaryId) {
      const glossary = await db.glossary.findFirst({
        where: { id: glossaryId, projectId },
      });
      if (!glossary) {
        throw new NotFoundException('Glossary not found');
      }
      return glossary;
    }

    return this.getActiveGlossary(projectId, db);
  }

  async listGlossaries(projectId: string): Promise<GlossarySetRecord[]> {
    await this.ensureDefaultGlossary(projectId);

    const glossaries = await this.prisma.glossary.findMany({
      where: { projectId },
      include: { _count: { select: { terms: true } } },
      orderBy: [{ isActive: 'desc' }, { isDefault: 'desc' }, { name: 'asc' }],
    });

    return glossaries.map((glossary) => ({
      id: glossary.id,
      name: glossary.name,
      isDefault: glossary.isDefault,
      isActive: glossary.isActive,
      termCount: glossary._count.terms,
      createdAt: glossary.createdAt,
    }));
  }

  async createGlossary(
    projectId: string,
    name: string,
    cloneFromActive = false,
  ): Promise<GlossarySetRecord> {
    const trimmedName = name.trim();
    const active = await this.getActiveGlossary(projectId);

    const glossary = await this.prisma.$transaction(async (tx) => {
      const created = await tx.glossary.create({
        data: {
          projectId,
          name: trimmedName,
          isDefault: false,
          isActive: false,
        },
      });

      if (cloneFromActive) {
        const terms = await tx.glossaryTerm.findMany({
          where: { glossaryId: active.id },
        });
        if (terms.length > 0) {
          await tx.glossaryTerm.createMany({
            data: terms.map((term) => ({
              glossaryId: created.id,
              sourceTerm: term.sourceTerm,
              targetTerm: term.targetTerm,
              doNotTranslate: term.doNotTranslate,
              note: term.note,
            })),
          });
        }
      }

      return created;
    });

    return {
      id: glossary.id,
      name: glossary.name,
      isDefault: glossary.isDefault,
      isActive: glossary.isActive,
      termCount: cloneFromActive
        ? (
            await this.prisma.glossaryTerm.count({
              where: { glossaryId: glossary.id },
            })
          )
        : 0,
      createdAt: glossary.createdAt,
    };
  }

  async activateGlossary(projectId: string, glossaryId: string) {
    const glossary = await this.prisma.glossary.findFirst({
      where: { id: glossaryId, projectId },
    });
    if (!glossary) {
      throw new NotFoundException('Glossary not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.glossary.updateMany({
        where: { projectId, isActive: true },
        data: { isActive: false },
      });
      await tx.glossary.update({
        where: { id: glossaryId },
        data: { isActive: true },
      });
    });

    return { activated: true, glossaryId };
  }

  async findTermBySource(glossaryId: string, sourceTerm: string) {
    return this.prisma.glossaryTerm.findUnique({
      where: {
        glossaryId_sourceTerm: {
          glossaryId,
          sourceTerm: sourceTerm.trim(),
        },
      },
    });
  }

  async getTermsForProject(projectId: string): Promise<GlossaryTermOption[]> {
    const glossary = await this.getActiveGlossary(projectId);
    const terms = await this.prisma.glossaryTerm.findMany({
      where: { glossaryId: glossary.id },
      orderBy: { sourceTerm: 'asc' },
    });

    return terms.map((term) => ({
      sourceTerm: term.sourceTerm,
      targetTerm: term.targetTerm,
      doNotTranslate: term.doNotTranslate,
    }));
  }

  async upsertTerm(
    projectId: string,
    input: UpsertGlossaryTermInput,
    db: DbClient = this.prisma,
  ): Promise<{ term: GlossaryTermRecord; created: boolean }> {
    const glossary = await this.getActiveGlossary(projectId, db);
    const normalized = normalizeUpsertInput(input);

    const existing = await db.glossaryTerm.findUnique({
      where: {
        glossaryId_sourceTerm: {
          glossaryId: glossary.id,
          sourceTerm: normalized.sourceTerm,
        },
      },
    });

    const term = await db.glossaryTerm.upsert({
      where: {
        glossaryId_sourceTerm: {
          glossaryId: glossary.id,
          sourceTerm: normalized.sourceTerm,
        },
      },
      create: {
        glossaryId: glossary.id,
        sourceTerm: normalized.sourceTerm,
        targetTerm: normalized.targetTerm,
        doNotTranslate: normalized.doNotTranslate,
        note: normalized.note,
      },
      update: {
        targetTerm: normalized.targetTerm,
        doNotTranslate: normalized.doNotTranslate,
        ...(input.note !== undefined ? { note: normalized.note } : {}),
      },
    });

    return { term: mapTerm(term), created: !existing };
  }

  async bulkUpsertTerms(
    projectId: string,
    terms: UpsertGlossaryTermInput[],
  ): Promise<{ created: number; updated: number; total: number }> {
    let created = 0;
    let updated = 0;

    for (const term of terms) {
      const result = await this.upsertTerm(projectId, term);
      if (result.created) {
        created += 1;
      } else {
        updated += 1;
      }
    }

    return { created, updated, total: terms.length };
  }
}
