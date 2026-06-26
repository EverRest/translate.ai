import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class TranslationAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getTranslationForTenant(tenantId: string, translationId: string) {
    const translation = await this.prisma.translation.findFirst({
      where: {
        id: translationId,
        translationKey: { project: { tenantId } },
      },
      include: {
        translationKey: { include: { project: true } },
      },
    });

    if (!translation) {
      throw new NotFoundException('Translation not found');
    }

    return translation;
  }
}
