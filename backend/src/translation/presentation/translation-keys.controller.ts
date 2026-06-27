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
  CreateTranslationKeyDto,
  UpdateTranslationKeyDto,
} from './dto/translation-key.dto';

@ApiTags('translation-keys')
@ApiBearerAuth()
@AllowApiKey()
@Controller('projects/:projectId/keys')
export class TranslationKeysController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List translation keys' })
  async list(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query() query: { page?: string; limit?: string; search?: string },
  ) {
    const { page, limit } = parsePagination(query);
    const data = await this.queryBus.execute(
      new ListTranslationKeysQuery(
        user.tenantId,
        projectId,
        page,
        limit,
        query.search,
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
      ),
    );
    return successResponse(data);
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
