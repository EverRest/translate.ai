import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { Roles } from '../../shared/auth/decorators/roles.decorator';
import { RolesGuard } from '../../shared/auth/guards/roles.guard';
import {
  paginatedResponse,
  successResponse,
} from '../../shared/presentation/api-response';
import { parsePagination } from '../../shared/utils/string.utils';
import {
  ApproveTranslationCommand,
  BulkApproveTranslationsCommand,
  ListProjectReviewsQuery,
  PublishTranslationCommand,
  RejectTranslationCommand,
  UpdateTranslationValueCommand,
} from '../application/approval.commands';
import {
  BulkApproveDto,
  RejectTranslationDto,
  UpdateTranslationValueDto,
} from './dto/approval.dto';

@ApiTags('approval')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller()
export class ApprovalController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('projects/:projectId/reviews')
  @Roles(UserRole.admin, UserRole.reviewer)
  @ApiOperation({ summary: 'List translations pending review' })
  async listReviews(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query()
    query: { page?: string; limit?: string; status?: 'pending' | 'approved' },
  ) {
    const { page, limit } = parsePagination(query);
    const data = await this.queryBus.execute(
      new ListProjectReviewsQuery(
        user.tenantId,
        projectId,
        page,
        limit,
        query.status === 'approved' ? 'approved' : 'pending',
      ),
    );
    return paginatedResponse(data.items, page, limit, data.meta.total);
  }

  @Post('projects/:projectId/reviews/bulk-approve')
  @Roles(UserRole.admin, UserRole.reviewer)
  @ApiOperation({ summary: 'Bulk approve translations' })
  async bulkApprove(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: BulkApproveDto,
  ) {
    const data = await this.commandBus.execute(
      new BulkApproveTranslationsCommand(
        user.tenantId,
        user.userId,
        projectId,
        dto.translationIds,
      ),
    );
    return successResponse(data);
  }

  @Post('translations/:translationId/approve')
  @Roles(UserRole.admin, UserRole.reviewer)
  @ApiOperation({ summary: 'Approve translation' })
  async approve(
    @CurrentUser() user: AuthUser,
    @Param('translationId') translationId: string,
  ) {
    const data = await this.commandBus.execute(
      new ApproveTranslationCommand(user.tenantId, user.userId, translationId),
    );
    return successResponse(data);
  }

  @Post('translations/:translationId/reject')
  @Roles(UserRole.admin, UserRole.reviewer)
  @ApiOperation({ summary: 'Reject translation' })
  async reject(
    @CurrentUser() user: AuthUser,
    @Param('translationId') translationId: string,
    @Body() dto: RejectTranslationDto,
  ) {
    const data = await this.commandBus.execute(
      new RejectTranslationCommand(
        user.tenantId,
        user.userId,
        translationId,
        dto.comment,
      ),
    );
    return successResponse(data);
  }

  @Post('translations/:translationId/publish')
  @Roles(UserRole.admin, UserRole.reviewer)
  @ApiOperation({ summary: 'Publish approved translation' })
  async publish(
    @CurrentUser() user: AuthUser,
    @Param('translationId') translationId: string,
  ) {
    const data = await this.commandBus.execute(
      new PublishTranslationCommand(user.tenantId, user.userId, translationId),
    );
    return successResponse(data);
  }

  @Patch('translations/:translationId')
  @Roles(UserRole.admin, UserRole.reviewer)
  @ApiOperation({ summary: 'Edit translation value during review' })
  async updateValue(
    @CurrentUser() user: AuthUser,
    @Param('translationId') translationId: string,
    @Body() dto: UpdateTranslationValueDto,
  ) {
    const data = await this.commandBus.execute(
      new UpdateTranslationValueCommand(
        user.tenantId,
        user.userId,
        translationId,
        dto.value,
      ),
    );
    return successResponse(data);
  }
}
