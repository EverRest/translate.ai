import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { AllowApiKey } from '../../shared/auth/decorators/allow-api-key.decorator';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { RolesGuard } from '../../shared/auth/guards/roles.guard';
import { successResponse } from '../../shared/presentation/api-response';
import {
  DownloadExportJobQuery,
  ExportProjectQuery,
  GetExportJobQuery,
  RequestExportCommand,
} from '../application/export.commands';
import type { ExportFormat } from '../application/export.commands';
import { RequestExportDto } from './request-export.dto';

@ApiTags('export')
@ApiBearerAuth()
@AllowApiKey()
@UseGuards(RolesGuard)
@Controller()
export class ExportController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('projects/:projectId/export')
  @ApiOperation({ summary: 'Export project translations (sync)' })
  async export(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query('format') format: ExportFormat = 'json',
    @Query('language') language?: string,
    @Query('status') status?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const data = await this.queryBus.execute(
      new ExportProjectQuery(
        user.tenantId,
        projectId,
        format,
        language,
        status,
      ),
    );

    res?.setHeader('Content-Type', data.contentType);
    res?.setHeader(
      'Content-Disposition',
      `attachment; filename="${data.filename}"`,
    );

    return data.content;
  }

  @Post('projects/:projectId/exports')
  @ApiOperation({
    summary: 'Request project export (sync inline or async queue)',
  })
  async requestExport(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() body: RequestExportDto,
  ) {
    const data = await this.commandBus.execute(
      new RequestExportCommand(
        user.tenantId,
        projectId,
        body.format,
        body.language,
        body.status,
      ),
    );
    return successResponse(data);
  }

  @Get('exports/:exportJobId')
  @ApiOperation({ summary: 'Get export job status' })
  async getExportJob(
    @CurrentUser() user: AuthUser,
    @Param('exportJobId') exportJobId: string,
  ) {
    const data = await this.queryBus.execute(
      new GetExportJobQuery(user.tenantId, exportJobId),
    );
    return successResponse(data);
  }

  @Get('exports/:exportJobId/download')
  @ApiOperation({ summary: 'Download completed export file' })
  async downloadExportJob(
    @CurrentUser() user: AuthUser,
    @Param('exportJobId') exportJobId: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const data = await this.queryBus.execute(
      new DownloadExportJobQuery(user.tenantId, exportJobId),
    );

    res?.setHeader('Content-Type', data.contentType);
    res?.setHeader(
      'Content-Disposition',
      `attachment; filename="${data.filename}"`,
    );

    return data.content;
  }
}
