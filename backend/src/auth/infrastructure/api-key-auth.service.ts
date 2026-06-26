import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ProjectStatus, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { AuthUser } from '../../shared/auth/auth-user.interface';

const API_KEY_PATTERN =
  /^ta_live_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_[0-9a-f]+$/;

@Injectable()
export class ApiKeyAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(token: string): Promise<AuthUser> {
    if (!token.startsWith('ta_live_')) {
      throw new UnauthorizedException('Invalid or missing token');
    }

    const parsed = API_KEY_PATTERN.exec(token);
    if (parsed) {
      return this.validateById(parsed[1], token);
    }

    return this.validateLegacy(token);
  }

  private async validateById(id: string, token: string): Promise<AuthUser> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, active: true },
      include: {
        project: { select: { id: true, tenantId: true, status: true } },
      },
    });

    if (
      !apiKey ||
      apiKey.project.status !== ProjectStatus.active ||
      !(await argon2.verify(apiKey.secretHash, token))
    ) {
      throw new UnauthorizedException('Invalid or missing token');
    }

    return this.toAuthUser(apiKey);
  }

  /** Keys created before the id-embedded format — verify by hash scan. */
  private async validateLegacy(token: string): Promise<AuthUser> {
    const keys = await this.prisma.apiKey.findMany({
      where: { active: true },
      include: {
        project: { select: { id: true, tenantId: true, status: true } },
      },
      take: 500,
    });

    for (const apiKey of keys) {
      if (apiKey.project.status !== ProjectStatus.active) {
        continue;
      }
      if (await argon2.verify(apiKey.secretHash, token)) {
        return this.toAuthUser(apiKey);
      }
    }

    throw new UnauthorizedException('Invalid or missing token');
  }

  private toAuthUser(apiKey: {
    id: string;
    name: string;
    projectId: string;
    project: { tenantId: string };
  }): AuthUser {
    return {
      userId: apiKey.id,
      tenantId: apiKey.project.tenantId,
      email: `api-key:${apiKey.name}`,
      role: UserRole.developer,
      authMethod: 'api_key',
      projectId: apiKey.projectId,
      apiKeyId: apiKey.id,
    };
  }
}
