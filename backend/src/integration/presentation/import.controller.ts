import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
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
  ApplyImportSessionCommand,
  CreateImportSessionCommand,
  GetImportSessionQuery,
  ListImportSessionsQuery,
  PreviewImportSessionQuery,
} from '../application/import.commands';
import { ApplyImportSessionDto, PasteImportDto } from './dto/import.dto';

@ApiTags('import')
@ApiBearerAuth()
@AllowApiKey()
@Controller('projects/:projectId/import')
export class ImportController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create import session from uploaded file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async createFromFile(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @UploadedFile() file: { buffer: Buffer; originalname: string } | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const data = await this.commandBus.execute(
      new CreateImportSessionCommand(
        user.tenantId,
        projectId,
        user.userId,
        file.buffer,
        file.originalname,
      ),
    );
    return successResponse(data);
  }

  @Post('sessions/paste')
  @ApiOperation({ summary: 'Create import session from pasted HTML' })
  async createFromPaste(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: PasteImportDto,
  ) {
    const buffer = Buffer.from(dto.html, 'utf8');
    const data = await this.commandBus.execute(
      new CreateImportSessionCommand(
        user.tenantId,
        projectId,
        user.userId,
        buffer,
        'paste.html',
        'paste_html',
      ),
    );
    return successResponse(data);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List import sessions' })
  async list(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query() query: { page?: string; limit?: string },
  ) {
    const { page, limit } = parsePagination(query);
    const data = await this.queryBus.execute(
      new ListImportSessionsQuery(user.tenantId, projectId, page, limit),
    );
    return paginatedResponse(data.items, page, limit, data.meta.total);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get import session status' })
  async get(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const data = await this.queryBus.execute(
      new GetImportSessionQuery(user.tenantId, projectId, sessionId),
    );
    return successResponse(data);
  }

  @Get('sessions/:sessionId/preview')
  @ApiOperation({ summary: 'Preview import diff items' })
  async preview(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
    @Query() query: { page?: string; limit?: string; action?: string },
  ) {
    const { page, limit } = parsePagination(query);
    const data = await this.queryBus.execute(
      new PreviewImportSessionQuery(
        user.tenantId,
        projectId,
        sessionId,
        page,
        limit,
        query.action,
      ),
    );
    return successResponse(data);
  }

  @Post('sessions/:sessionId/apply')
  @ApiOperation({ summary: 'Apply import session to project keys' })
  async apply(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: ApplyImportSessionDto,
  ) {
    const data = await this.commandBus.execute(
      new ApplyImportSessionCommand(
        user.tenantId,
        projectId,
        sessionId,
        dto.conflictStrategy ?? 'update',
      ),
    );
    return successResponse(data);
  }
}
