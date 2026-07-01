import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ProjectAccessService } from '../../project/infrastructure/project-access.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { AllowApiKey } from '../../shared/auth/decorators/allow-api-key.decorator';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import {
  paginatedResponse,
  successResponse,
} from '../../shared/presentation/api-response';
import { parsePagination } from '../../shared/utils/string.utils';
import {
  GetTranslationQuery,
  ListTranslationsQuery,
  LookupTranslationsQuery,
  RecordTranslationQualityCommand,
} from '../application/translation.queries';
import {
  GetStaleTranslationKeyHintsQuery,
  GetStaleTranslationSummaryQuery,
} from '../application/stale-translation.queries';
import {
  LookupTranslationsDto,
  RecordTranslationQualityDto,
} from './dto/translation.dto';
import {
  StaleTranslationKeyHintsDto,
  StaleTranslationSummaryDto,
} from './dto/stale-translation.dto';
import { ListTranslationsQueryDto } from './dto/list-translations-query.dto';

@ApiTags('translations')
@ApiBearerAuth()
@AllowApiKey()
@Controller('projects/:projectId/translations')
export class TranslationsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  @Delete()
  @ApiOperation({ summary: 'Delete all translations for a project' })
  async deleteAll(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    await this.projectAccess.getProjectForTenant(user.tenantId, projectId);
    const { count } = await this.prisma.translation.deleteMany({
      where: { translationKey: { projectId } },
    });
    return successResponse({ deleted: count });
  }

  @Get('stale-summary')
  @ApiOperation({ summary: 'Stale translation counts (source changed)' })
  @ApiOkResponse({ type: StaleTranslationSummaryDto })
  async staleSummary(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new GetStaleTranslationSummaryQuery(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Get('stale-key-hints')
  @ApiOperation({
    summary: 'Translation key IDs with at least one stale translation',
  })
  @ApiOkResponse({ type: StaleTranslationKeyHintsDto })
  async staleKeyHints(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new GetStaleTranslationKeyHintsQuery(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Get()
  @ApiOperation({
    summary: 'List translations for a project',
    description:
      'Each item includes `isStale` when the stored source snapshot differs from the key current source text (normalized).',
  })
  async list(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query() query: ListTranslationsQueryDto,
  ) {
    const { page, limit } = parsePagination(query);
    const keys = query.keys
      ? query.keys
          .split(',')
          .map((key) => key.trim())
          .filter(Boolean)
      : undefined;

    const data = await this.queryBus.execute(
      new ListTranslationsQuery(
        user.tenantId,
        projectId,
        page,
        limit,
        query.language,
        query.status,
        keys,
        query.localizationObjectId,
        query.keyPrefix,
      ),
    );

    return paginatedResponse(data.items, page, limit, data.meta.total);
  }

  @Post('lookup')
  @ApiOperation({ summary: 'Fetch several translations by key and language' })
  async lookup(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: LookupTranslationsDto,
  ) {
    const data = await this.queryBus.execute(
      new LookupTranslationsQuery(
        user.tenantId,
        projectId,
        dto.items,
        dto.status,
      ),
    );
    return successResponse(data);
  }

  @Get(':translationId')
  @ApiOperation({ summary: 'Get a single translation by id' })
  async get(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('translationId') translationId: string,
  ) {
    const data = await this.queryBus.execute(
      new GetTranslationQuery(user.tenantId, projectId, translationId),
    );
    return successResponse(data);
  }

  @Post(':translationId/quality')
  @ApiOperation({
    summary: 'Record a manual AI accuracy score for a translation',
  })
  async recordQuality(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('translationId') translationId: string,
    @Body() dto: RecordTranslationQualityDto,
  ) {
    const data = await this.commandBus.execute(
      new RecordTranslationQualityCommand(
        user.tenantId,
        projectId,
        translationId,
        user.userId,
        dto.score,
        dto.referenceValue,
        dto.notes,
      ),
    );
    return successResponse(data);
  }
}
