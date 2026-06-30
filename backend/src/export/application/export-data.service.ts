import { Injectable } from '@nestjs/common';
import { TranslationStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ExportRow } from './export.commands';

export type ExportFilter = {
  projectId: string;
  status: TranslationStatus;
  language?: string;
};

@Injectable()
export class ExportDataService {
  constructor(private readonly prisma: PrismaService) {}

  countTranslations(filter: ExportFilter): Promise<number> {
    return this.prisma.translation.count({
      where: this.buildWhere(filter),
    });
  }

  loadExportRows(filter: ExportFilter): Promise<ExportRow[]> {
    return this.prisma.translation
      .findMany({
        where: this.buildWhere(filter),
        include: {
          translationKey: { select: { key: true } },
        },
        orderBy: [{ translationKey: { key: 'asc' } }, { language: 'asc' }],
      })
      .then((translations) =>
        translations.map((translation) => ({
          key: translation.translationKey.key,
          language: translation.language,
          value: translation.value,
        })),
      );
  }

  private buildWhere(filter: ExportFilter) {
    return {
      status: filter.status,
      translationKey: { projectId: filter.projectId },
      ...(filter.language ? { language: filter.language } : {}),
    };
  }
}
