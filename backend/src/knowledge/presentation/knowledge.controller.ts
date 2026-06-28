import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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
import { KnowledgeSourceType } from '@prisma/client';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { successResponse } from '../../shared/presentation/api-response';
import {
  CreateKnowledgeSourceCommand,
  DeleteKnowledgeSourceCommand,
  ListKnowledgeSourcesQuery,
} from '../application/knowledge.commands';
import { CreateKnowledgeSourceDto } from './dto/knowledge.dto';

@ApiTags('knowledge')
@ApiBearerAuth()
@Controller('projects/:projectId/knowledge/sources')
export class KnowledgeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List project knowledge sources' })
  async list(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new ListKnowledgeSourcesQuery(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Post()
  @ApiOperation({ summary: 'Create a knowledge source from JSON body' })
  async create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateKnowledgeSourceDto,
  ) {
    const data = await this.commandBus.execute(
      new CreateKnowledgeSourceCommand(
        user.tenantId,
        projectId,
        dto.name,
        dto.sourceType,
        dto.content,
        dto.originalFilename,
      ),
    );
    return successResponse(data);
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a .txt or .md knowledge file' })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @UploadedFile()
    file: { originalname: string; buffer: Buffer } | undefined,
    @Body('name') name?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const filename = file.originalname.toLowerCase();
    if (!filename.endsWith('.txt') && !filename.endsWith('.md')) {
      throw new BadRequestException('Only .txt and .md files are supported');
    }

    const content = file.buffer.toString('utf8');
    const sourceType = filename.endsWith('.md')
      ? KnowledgeSourceType.markdown
      : KnowledgeSourceType.file;

    const data = await this.commandBus.execute(
      new CreateKnowledgeSourceCommand(
        user.tenantId,
        projectId,
        name?.trim() || file.originalname,
        sourceType,
        content,
        file.originalname,
      ),
    );
    return successResponse(data);
  }

  @Delete(':sourceId')
  @ApiOperation({ summary: 'Delete a knowledge source and its chunks' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('sourceId') sourceId: string,
  ) {
    const data = await this.commandBus.execute(
      new DeleteKnowledgeSourceCommand(user.tenantId, projectId, sourceId),
    );
    return successResponse(data);
  }
}
