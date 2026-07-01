import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TokenEncryptionService } from './token-encryption.service';

export interface AtlassianOAuthCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  source: 'tenant' | 'platform';
}

@Injectable()
export class AtlassianOAuthCredentialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly encryption: TokenEncryptionService,
  ) {}

  async resolve(tenantId?: string): Promise<AtlassianOAuthCredentials | null> {
    if (tenantId) {
      const tenantApp = await this.prisma.tenantAtlassianOAuthApp.findUnique({
        where: { tenantId },
      });
      if (tenantApp) {
        return {
          clientId: tenantApp.clientId,
          clientSecret: this.encryption.decrypt(tenantApp.clientSecretEnc),
          redirectUri:
            tenantApp.redirectUri ??
            this.config.get<string>(
              'ATLASSIAN_REDIRECT_URI',
              'http://localhost:3000/api/v1/integrations/confluence/oauth/callback',
            ),
          scopes: (tenantApp.scopes ?? this.defaultScopesRaw())
            .split(/\s+/)
            .filter(Boolean),
          source: 'tenant',
        };
      }
    }

    const clientId = this.config.get<string>('ATLASSIAN_CLIENT_ID', '');
    const clientSecret = this.config.get<string>('ATLASSIAN_CLIENT_SECRET', '');
    if (!clientId || !clientSecret) {
      return null;
    }

    return {
      clientId,
      clientSecret,
      redirectUri: this.config.get<string>(
        'ATLASSIAN_REDIRECT_URI',
        'http://localhost:3000/api/v1/integrations/confluence/oauth/callback',
      ),
      scopes: this.defaultScopesRaw().split(/\s+/).filter(Boolean),
      source: 'platform',
    };
  }

  async isConfigured(tenantId?: string): Promise<boolean> {
    return (await this.resolve(tenantId)) !== null;
  }

  private defaultScopesRaw(): string {
    return this.config.get<string>(
      'ATLASSIAN_SCOPES',
      'read:confluence-content.all read:confluence-space.summary offline_access',
    );
  }
}
