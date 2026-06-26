import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { Roles } from '../../shared/auth/decorators/roles.decorator';
import { RolesGuard } from '../../shared/auth/guards/roles.guard';
import { successResponse } from '../../shared/presentation/api-response';
import {
  CreateBranchCommand,
  GetBranchDiffQuery,
  ListBranchesQuery,
  MergeBranchCommand,
  UpdateBranchTranslationCommand,
} from '../application/branching.commands';
import {
  CreateBranchDto,
  UpdateBranchTranslationDto,
} from './dto/branching.dto';

@ApiTags('branches')
@ApiBearerAuth()
@Controller('projects/:projectId/branches')
export class BranchingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List project branches' })
  async list(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new ListBranchesQuery(user.tenantId, projectId),
    );
    return successResponse({ items: data });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.developer)
  @ApiOperation({ summary: 'Create a feature branch from main' })
  async create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateBranchDto,
  ) {
    const data = await this.commandBus.execute(
      new CreateBranchCommand(user.tenantId, projectId, dto.name),
    );
    return successResponse(data);
  }

  @Get(':branchId/diff')
  @ApiOperation({ summary: 'Diff branch translations against main' })
  async diff(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('branchId') branchId: string,
  ) {
    const data = await this.queryBus.execute(
      new GetBranchDiffQuery(user.tenantId, projectId, branchId),
    );
    return successResponse({ items: data });
  }

  @Patch(':branchId/translations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.developer)
  @ApiOperation({ summary: 'Update a translation on a feature branch' })
  async updateTranslation(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('branchId') branchId: string,
    @Body() dto: UpdateBranchTranslationDto,
  ) {
    const data = await this.commandBus.execute(
      new UpdateBranchTranslationCommand(
        user.tenantId,
        projectId,
        branchId,
        dto.translationKeyId,
        dto.language,
        dto.value,
      ),
    );
    return successResponse(data);
  }

  @Post(':branchId/merge')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin, UserRole.developer)
  @ApiOperation({ summary: 'Merge branch translations into main' })
  async merge(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('branchId') branchId: string,
  ) {
    const data = await this.commandBus.execute(
      new MergeBranchCommand(user.tenantId, projectId, branchId, user.userId),
    );
    return successResponse(data);
  }
}
