import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface AuditLogInput {
  tenantId: string;
  userId?: string;
  entity: string;
  entityId: string;
  action: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(input: AuditLogInput): Promise<void> {
    return this.prisma.auditLog
      .create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          entity: input.entity,
          entityId: input.entityId,
          action: input.action,
          payload: input.payload as Prisma.InputJsonValue | undefined,
        },
      })
      .then(() => undefined);
  }
}
