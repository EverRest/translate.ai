import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { successResponse } from '../../shared/presentation/api-response';
import {
  ApplyGlossaryPresetCommand,
  ListGlossaryPresetsQuery,
} from '../application/glossary-preset.commands';
import { ApplyGlossaryPresetDto } from './dto/glossary-preset.dto';

@ApiTags('glossary')
@ApiBearerAuth()
@Controller('projects/:projectId/glossary')
export class GlossaryPresetsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('presets')
  @ApiOperation({ summary: 'List built-in glossary presets' })
  async listPresets(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new ListGlossaryPresetsQuery(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Post('apply-preset')
  @ApiOperation({ summary: 'Apply a glossary preset to the active set' })
  async applyPreset(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: ApplyGlossaryPresetDto,
  ) {
    const data = await this.commandBus.execute(
      new ApplyGlossaryPresetCommand(
        user.tenantId,
        projectId,
        dto.presetId,
        dto.mode ?? 'merge',
      ),
    );
    return successResponse(data);
  }
}
