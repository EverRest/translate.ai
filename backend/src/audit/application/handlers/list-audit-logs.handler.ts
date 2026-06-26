import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ListAuditLogsQuery } from '../audit.queries';

@Injectable()
@QueryHandler(ListAuditLogsQuery)
export class ListAuditLogsHandler implements IQueryHandler<ListAuditLogsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListAuditLogsQuery) {
    const where: Prisma.AuditLogWhereInput = {
      tenantId: query.tenantId,
      ...(query.entity ? { entity: query.entity } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((log) => ({
        id: log.id,
        entity: log.entity,
        entityId: log.entityId,
        action: log.action,
        payload: log.payload,
        userId: log.userId,
        userEmail: log.user?.email ?? null,
        createdAt: log.createdAt,
      })),
      meta: { page: query.page, limit: query.limit, total },
    };
  }
}
