import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  MessageEvent,
  Param,
  Post,
  Query,
  Sse,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { AllowApiKey } from '../../shared/auth/decorators/allow-api-key.decorator';
import { Public } from '../../shared/auth/decorators/public.decorator';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import {
  paginatedResponse,
  successResponse,
} from '../../shared/presentation/api-response';
import { parsePagination } from '../../shared/utils/string.utils';
import {
  CancelTranslationJobCommand,
  CreateTranslationJobCommand,
  GetJobStatusQuery,
  ListTranslationJobsQuery,
  RetryTranslationJobCommand,
} from '../application/job.commands';
import { TranslationSseService } from '../application/services/translation-sse.service';
import { CreateJobDto } from './dto/create-job.dto';

function scopedProjectId(user: AuthUser): string | undefined {
  return user.authMethod === 'api_key' ? user.projectId : undefined;
}

function resolveProjectId(user: AuthUser, projectId?: string): string {
  if (user.authMethod === 'api_key') {
    if (!user.projectId) {
      throw new BadRequestException('Invalid API key scope');
    }
    if (projectId && projectId !== user.projectId) {
      throw new ForbiddenException(
        `API key is bound to project ${user.projectId} only`,
      );
    }
    return user.projectId;
  }

  if (!projectId) {
    throw new BadRequestException('projectId is required');
  }
  return projectId;
}

@ApiTags('jobs')
@ApiBearerAuth()
@AllowApiKey()
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly sseService: TranslationSseService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create translation job' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateJobDto) {
    const projectId = resolveProjectId(user, dto.projectId);
    const data = await this.commandBus.execute(
      new CreateTranslationJobCommand(
        user.tenantId,
        projectId,
        dto.languages,
        dto.keys ?? [],
        dto.keyItems,
        dto.provider,
        dto.clientRequestId,
        user.authMethod === 'jwt' ? user.userId : undefined,
      ),
    );
    return successResponse(data);
  }

  @Get()
  @ApiOperation({ summary: 'List translation jobs' })
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: { projectId?: string; page?: string; limit?: string },
  ) {
    const { page, limit } = parsePagination(query);
    const data = await this.queryBus.execute(
      new ListTranslationJobsQuery(
        user.tenantId,
        query.projectId,
        page,
        limit,
        scopedProjectId(user),
      ),
    );
    return paginatedResponse(data.items, page, limit, data.meta.total);
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Get translation job status' })
  async get(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string) {
    const data = await this.queryBus.execute(
      new GetJobStatusQuery(user.tenantId, jobId, scopedProjectId(user)),
    );
    return successResponse(data);
  }

  @Post(':jobId/retry')
  @ApiOperation({ summary: 'Retry failed translation job items' })
  async retry(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string) {
    const data = await this.commandBus.execute(
      new RetryTranslationJobCommand(
        user.tenantId,
        jobId,
        scopedProjectId(user),
      ),
    );
    return successResponse(data);
  }

  @Public()
  @Sse(':jobId/stream')
  @ApiOperation({ summary: 'Stream job progress via SSE' })
  streamJob(
    @Param('jobId') jobId: string,
    @Query('projectId') projectId: string,
    @Query('token') token: string,
  ): Observable<MessageEvent> {
    if (!token) throw new UnauthorizedException('Missing token');
    try {
      this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    if (!projectId) throw new BadRequestException('projectId is required');

    return this.sseService.streamJob(
      jobId,
      projectId,
    ) as Observable<MessageEvent>;
  }

  @Post(':jobId/cancel')
  @ApiOperation({ summary: 'Cancel translation job' })
  async cancel(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string) {
    const data = await this.commandBus.execute(
      new CancelTranslationJobCommand(
        user.tenantId,
        jobId,
        scopedProjectId(user),
      ),
    );
    return successResponse(data);
  }
}
