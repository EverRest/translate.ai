import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BranchStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { MAIN_BRANCH_NAME } from './branching.commands';

@Injectable()
export class BranchingService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureMainBranch(projectId: string) {
    return this.prisma.projectBranch.upsert({
      where: {
        projectId_name: { projectId, name: MAIN_BRANCH_NAME },
      },
      create: {
        projectId,
        name: MAIN_BRANCH_NAME,
        isDefault: true,
        status: BranchStatus.active,
      },
      update: {},
    });
  }

  async getBranchForProject(projectId: string, branchId: string) {
    const branch = await this.prisma.projectBranch.findFirst({
      where: { id: branchId, projectId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  assertMutableBranch(branch: { isDefault: boolean; status: BranchStatus }) {
    if (branch.isDefault) {
      throw new BadRequestException('Cannot modify the main branch');
    }
    if (branch.status !== BranchStatus.active) {
      throw new BadRequestException('Branch is not active');
    }
  }

  async copyMainTranslationsToBranch(branchId: string, projectId: string) {
    const mainTranslations = await this.prisma.translation.findMany({
      where: { translationKey: { projectId } },
    });

    if (mainTranslations.length === 0) {
      return;
    }

    await this.prisma.branchTranslation.createMany({
      data: mainTranslations.map((translation) => ({
        branchId,
        translationKeyId: translation.translationKeyId,
        language: translation.language,
        value: translation.value,
        status: translation.status,
      })),
    });
  }
}
