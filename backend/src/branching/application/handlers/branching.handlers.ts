import {
  CommandHandler,
  ICommandHandler,
  IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { BranchStatus, TranslationStatus } from '@prisma/client';
import { AuditService } from '../../../audit/application/audit.service';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  CreateBranchCommand,
  GetBranchDiffQuery,
  ListBranchesQuery,
  MAIN_BRANCH_NAME,
  MergeBranchCommand,
  UpdateBranchTranslationCommand,
} from '../branching.commands';
import { BranchingService } from '../branching.service';

function mapBranch(branch: {
  id: string;
  name: string;
  isDefault: boolean;
  status: BranchStatus;
  createdAt: Date;
  mergedAt: Date | null;
}) {
  return {
    id: branch.id,
    name: branch.name,
    isDefault: branch.isDefault,
    status: branch.status,
    createdAt: branch.createdAt,
    mergedAt: branch.mergedAt,
  };
}

@Injectable()
@QueryHandler(ListBranchesQuery)
export class ListBranchesHandler implements IQueryHandler<ListBranchesQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly branching: BranchingService,
  ) {}

  async execute(query: ListBranchesQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );
    await this.branching.ensureMainBranch(query.projectId);

    const branches = await this.prisma.projectBranch.findMany({
      where: { projectId: query.projectId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return branches.map(mapBranch);
  }
}

@Injectable()
@QueryHandler(GetBranchDiffQuery)
export class GetBranchDiffHandler implements IQueryHandler<GetBranchDiffQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly branching: BranchingService,
  ) {}

  async execute(query: GetBranchDiffQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const branch = await this.branching.getBranchForProject(
      query.projectId,
      query.branchId,
    );
    if (branch.isDefault) {
      return [];
    }

    const branchTranslations = await this.prisma.branchTranslation.findMany({
      where: { branchId: branch.id },
      include: { translationKey: { select: { key: true } } },
    });

    const mainTranslations = await this.prisma.translation.findMany({
      where: {
        translationKey: { projectId: query.projectId },
      },
    });

    const mainByKey = new Map(
      mainTranslations.map((row) => [
        `${row.translationKeyId}:${row.language}`,
        row,
      ]),
    );

    const diffs = branchTranslations
      .map((row) => {
        const main = mainByKey.get(`${row.translationKeyId}:${row.language}`);
        const mainValue = main?.value ?? null;

        if (mainValue === row.value) {
          return null;
        }

        return {
          translationKeyId: row.translationKeyId,
          key: row.translationKey.key,
          language: row.language,
          mainValue,
          branchValue: row.value,
          changeType:
            mainValue === null ? ('added' as const) : ('changed' as const),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    return diffs.sort((a, b) => a.key.localeCompare(b.key));
  }
}

@Injectable()
@CommandHandler(CreateBranchCommand)
export class CreateBranchHandler implements ICommandHandler<CreateBranchCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly branching: BranchingService,
  ) {}

  async execute(command: CreateBranchCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const name = command.name.trim().toLowerCase();
    if (!name || name === MAIN_BRANCH_NAME) {
      throw new BadRequestException('Invalid branch name');
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
      throw new BadRequestException(
        'Branch name must be lowercase alphanumeric with hyphens',
      );
    }

    await this.branching.ensureMainBranch(command.projectId);

    try {
      const branch = await this.prisma.projectBranch.create({
        data: {
          projectId: command.projectId,
          name,
          isDefault: false,
          status: BranchStatus.active,
        },
      });

      await this.branching.copyMainTranslationsToBranch(
        branch.id,
        command.projectId,
      );

      return mapBranch(branch);
    } catch {
      throw new ConflictException('Branch name already exists');
    }
  }
}

@Injectable()
@CommandHandler(UpdateBranchTranslationCommand)
export class UpdateBranchTranslationHandler implements ICommandHandler<UpdateBranchTranslationCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly branching: BranchingService,
  ) {}

  async execute(command: UpdateBranchTranslationCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const branch = await this.branching.getBranchForProject(
      command.projectId,
      command.branchId,
    );
    this.branching.assertMutableBranch(branch);

    const key = await this.prisma.translationKey.findFirst({
      where: { id: command.translationKeyId, projectId: command.projectId },
    });
    if (!key) {
      throw new BadRequestException('Translation key not found');
    }

    const row = await this.prisma.branchTranslation.upsert({
      where: {
        branchId_translationKeyId_language: {
          branchId: branch.id,
          translationKeyId: command.translationKeyId,
          language: command.language,
        },
      },
      create: {
        branchId: branch.id,
        translationKeyId: command.translationKeyId,
        language: command.language,
        value: command.value.trim(),
        status: TranslationStatus.draft,
      },
      update: {
        value: command.value.trim(),
        status: TranslationStatus.draft,
      },
      include: { translationKey: { select: { key: true } } },
    });

    return {
      translationKeyId: row.translationKeyId,
      key: row.translationKey.key,
      language: row.language,
      value: row.value,
    };
  }
}

@Injectable()
@CommandHandler(MergeBranchCommand)
export class MergeBranchHandler implements ICommandHandler<MergeBranchCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly branching: BranchingService,
    private readonly audit: AuditService,
  ) {}

  async execute(command: MergeBranchCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const branch = await this.branching.getBranchForProject(
      command.projectId,
      command.branchId,
    );
    this.branching.assertMutableBranch(branch);

    const branchTranslations = await this.prisma.branchTranslation.findMany({
      where: { branchId: branch.id },
    });

    const mainTranslations = await this.prisma.translation.findMany({
      where: { translationKey: { projectId: command.projectId } },
    });

    const mainByKey = new Map(
      mainTranslations.map((row) => [
        `${row.translationKeyId}:${row.language}`,
        row,
      ]),
    );

    let mergedCount = 0;

    for (const row of branchTranslations) {
      const main = mainByKey.get(`${row.translationKeyId}:${row.language}`);
      if (main?.value === row.value) {
        continue;
      }

      if (main) {
        await this.prisma.translation.update({
          where: { id: main.id },
          data: {
            value: row.value,
            status: TranslationStatus.draft,
            version: main.version + 1,
          },
        });
      } else {
        await this.prisma.translation.create({
          data: {
            translationKeyId: row.translationKeyId,
            language: row.language,
            value: row.value,
            status: TranslationStatus.draft,
          },
        });
      }

      mergedCount += 1;
    }

    const updatedBranch = await this.prisma.projectBranch.update({
      where: { id: branch.id },
      data: {
        status: BranchStatus.merged,
        mergedAt: new Date(),
      },
    });

    await this.audit.log({
      tenantId: command.tenantId,
      userId: command.userId,
      entity: 'branch',
      entityId: branch.id,
      action: 'merged',
      payload: {
        branchName: branch.name,
        mergedCount,
      },
    });

    return {
      branch: mapBranch(updatedBranch),
      mergedCount,
    };
  }
}
