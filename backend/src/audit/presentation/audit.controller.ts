import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { RolesGuard } from '../../shared/auth/guards/roles.guard';
import { paginatedResponse } from '../../shared/presentation/api-response';
import { parsePagination } from '../../shared/utils/string.utils';
import { ListAuditLogsQuery } from '../application/audit.queries';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs for current tenant' })
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: { page?: string; limit?: string; entity?: string },
  ) {
    const { page, limit } = parsePagination(query);
    const data = await this.queryBus.execute(
      new ListAuditLogsQuery(user.tenantId, page, limit, query.entity),
    );
    return paginatedResponse(data.items, page, limit, data.meta.total);
  }
}
