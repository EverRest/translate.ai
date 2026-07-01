import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { AllowApiKey } from '../../shared/auth/decorators/allow-api-key.decorator';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import {
  paginatedResponse,
  successResponse,
} from '../../shared/presentation/api-response';
import { parsePagination } from '../../shared/utils/string.utils';
import {
  CreateTranslationKeyCommand,
  DeleteTranslationKeyCommand,
  ListTranslationKeysQuery,
  UpdateTranslationKeyCommand,
} from '../application/translation-key.commands';
import {
  BulkImportKeysDto,
  CreateTranslationKeyDto,
  UpdateTranslationKeyDto,
} from './dto/translation-key.dto';
import { ListTranslationKeysQueryDto } from './dto/list-translation-keys-query.dto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ProjectAccessService } from '../../project/infrastructure/project-access.service';

@ApiTags('translation-keys')
@ApiBearerAuth()
@AllowApiKey()
@Controller('projects/:projectId/keys')
export class TranslationKeysController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List translation keys',
    description:
      'Use `staleOnly=true` to return only keys with at least one stale translation.',
  })
  async list(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query() query: ListTranslationKeysQueryDto,
  ) {
    const { page, limit } = parsePagination(query);
    const data = await this.queryBus.execute(
      new ListTranslationKeysQuery(
        user.tenantId,
        projectId,
        page,
        limit,
        query.search,
        query.localizationObjectId,
        query.keyPrefix,
        query.staleOnly === 'true' || query.staleOnly === '1',
      ),
    );
    return paginatedResponse(data.items, page, limit, data.meta.total);
  }

  @Post()
  @ApiOperation({ summary: 'Create translation key' })
  async create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTranslationKeyDto,
  ) {
    const data = await this.commandBus.execute(
      new CreateTranslationKeyCommand(
        user.tenantId,
        projectId,
        dto.key,
        dto.sourceText,
        dto.description,
        dto.context,
        dto.contentType,
      ),
    );
    return successResponse(data);
  }

  @Post('bulk-import')
  @ApiOperation({ summary: 'Bulk upsert translation keys' })
  async bulkImport(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: BulkImportKeysDto,
  ) {
    await this.projectAccess.getProjectForTenant(user.tenantId, projectId);

    const data = dto.keys.map((item) => ({
      projectId,
      key: item.key,
      sourceText: item.sourceText,
    }));

    await this.prisma.translationKey.createMany({
      data,
      skipDuplicates: true,
    });

    const existing = await this.prisma.translationKey.findMany({
      where: { projectId, key: { in: dto.keys.map((k) => k.key) } },
      select: { id: true, key: true },
    });

    return successResponse({
      created: existing.length,
      total: dto.keys.length,
    });
  }

  @Patch(':keyId')
  @ApiOperation({ summary: 'Update translation key' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('keyId') keyId: string,
    @Body() dto: UpdateTranslationKeyDto,
  ) {
    const data = await this.commandBus.execute(
      new UpdateTranslationKeyCommand(
        user.tenantId,
        projectId,
        keyId,
        dto.description,
        dto.context,
        dto.contentType,
        dto.sourceText,
      ),
    );
    return successResponse(data);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all translation keys for a project' })
  async removeAll(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    await this.projectAccess.getProjectForTenant(user.tenantId, projectId);
    const { count } = await this.prisma.translationKey.deleteMany({
      where: { projectId },
    });
    return successResponse({ deleted: count });
  }

  @Delete(':keyId')
  @ApiOperation({ summary: 'Delete translation key' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('keyId') keyId: string,
  ) {
    const data = await this.commandBus.execute(
      new DeleteTranslationKeyCommand(user.tenantId, projectId, keyId),
    );
    return successResponse(data);
  }
}
