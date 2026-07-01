import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TokenEncryptionService } from '../infrastructure/token-encryption.service';
import {
  DeleteTenantAtlassianOAuthCommand,
  GetTenantAtlassianOAuthQuery,
  UpsertTenantAtlassianOAuthCommand,
} from '../application/confluence.commands';

@Injectable()
export class TenantAtlassianOAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: TokenEncryptionService,
  ) {}

  async get(query: GetTenantAtlassianOAuthQuery) {
    const app = await this.prisma.tenantAtlassianOAuthApp.findUnique({
      where: { tenantId: query.tenantId },
    });
    if (!app) {
      return { configured: false };
    }
    return {
      configured: true,
      clientId: app.clientId,
      redirectUri: app.redirectUri,
      scopes: app.scopes,
      hasSecret: true,
      updatedAt: app.updatedAt,
    };
  }

  async upsert(command: UpsertTenantAtlassianOAuthCommand) {
    const app = await this.prisma.tenantAtlassianOAuthApp.upsert({
      where: { tenantId: command.tenantId },
      create: {
        tenantId: command.tenantId,
        clientId: command.clientId,
        clientSecretEnc: this.encryption.encrypt(command.clientSecret),
        redirectUri: command.redirectUri,
        scopes: command.scopes,
      },
      update: {
        clientId: command.clientId,
        clientSecretEnc: this.encryption.encrypt(command.clientSecret),
        redirectUri: command.redirectUri,
        scopes: command.scopes,
      },
    });
    return {
      configured: true,
      clientId: app.clientId,
      redirectUri: app.redirectUri,
      scopes: app.scopes,
      hasSecret: true,
      updatedAt: app.updatedAt,
    };
  }

  async delete(command: DeleteTenantAtlassianOAuthCommand) {
    await this.prisma.tenantAtlassianOAuthApp.deleteMany({
      where: { tenantId: command.tenantId },
    });
    return { deleted: true };
  }
}
