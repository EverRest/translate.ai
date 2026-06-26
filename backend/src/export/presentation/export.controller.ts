import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { AllowApiKey } from '../../shared/auth/decorators/allow-api-key.decorator';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { RolesGuard } from '../../shared/auth/guards/roles.guard';
import { ExportProjectQuery } from '../application/export.commands';
import type { ExportFormat } from '../application/export.commands';

@ApiTags('export')
@ApiBearerAuth()
@AllowApiKey()
@UseGuards(RolesGuard)
@Controller('projects/:projectId')
export class ExportController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('export')
  @ApiOperation({ summary: 'Export project translations' })
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
}
