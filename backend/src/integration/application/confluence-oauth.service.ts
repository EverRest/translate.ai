import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConfluenceApiClient } from '../infrastructure/confluence-api.client';
import { TokenEncryptionService } from '../infrastructure/token-encryption.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface ConfluenceOAuthState {
  tenantId: string;
  projectId: string;
  userId: string;
}

export interface ConfluenceOAuthSetupHint {
  steps: string[];
  scopes: string[];
  envVars: string[];
  redirectUri: string;
  docsUrl: string;
}

@Injectable()
export class ConfluenceOAuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly api: ConfluenceApiClient,
    private readonly encryption: TokenEncryptionService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  createAuthorizeUrl(state: ConfluenceOAuthState): string {
    this.assertOAuthConfigured();
    const token = this.jwt.sign(state, { expiresIn: '15m' });
    return this.api.getAuthorizeUrl(token);
  }

  verifyState(state: string): ConfluenceOAuthState {
    try {
      return this.jwt.verify<ConfluenceOAuthState>(state);
    } catch {
      throw new UnauthorizedException('Invalid OAuth state');
    }
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ projectId: string; siteName: string }> {
    const oauthState = this.verifyState(state);
    const tokens = await this.api.exchangeCode(code);
    const resources = await this.api.getAccessibleResources(
      tokens.access_token,
    );
    const confluence = resources.find((r: { scopes: string[] }) =>
      r.scopes.some((s: string) => s.includes('confluence')),
    );
    if (!confluence) {
      throw new Error('No Confluence site found for this Atlassian account');
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const connection = await this.prisma.confluenceConnection.upsert({
      where: { projectId: oauthState.projectId },
      create: {
        tenantId: oauthState.tenantId,
        projectId: oauthState.projectId,
        cloudId: confluence.id,
        siteUrl: confluence.url,
        siteName: confluence.name,
        accessTokenEnc: this.encryption.encrypt(tokens.access_token),
        refreshTokenEnc: tokens.refresh_token
          ? this.encryption.encrypt(tokens.refresh_token)
          : null,
        tokenExpiresAt: expiresAt,
        scopes: tokens.scope ?? null,
        connectedById: oauthState.userId,
      },
      update: {
        cloudId: confluence.id,
        siteUrl: confluence.url,
        siteName: confluence.name,
        accessTokenEnc: this.encryption.encrypt(tokens.access_token),
        refreshTokenEnc: tokens.refresh_token
          ? this.encryption.encrypt(tokens.refresh_token)
          : null,
        tokenExpiresAt: expiresAt,
        scopes: tokens.scope ?? null,
        connectedById: oauthState.userId,
      },
    });

    await this.prisma.confluenceSyncConfig.upsert({
      where: { connectionId: connection.id },
      create: { connectionId: connection.id, pageIds: [] },
      update: {},
    });

    return {
      projectId: oauthState.projectId,
      siteName: confluence.name,
    };
  }

  async getValidAccessToken(connectionId: string): Promise<string> {
    const connection = await this.prisma.confluenceConnection.findUniqueOrThrow(
      { where: { id: connectionId } },
    );

    const now = Date.now();
    const expires = connection.tokenExpiresAt?.getTime() ?? 0;
    if (expires > now + 60_000) {
      return this.encryption.decrypt(connection.accessTokenEnc);
    }

    if (!connection.refreshTokenEnc) {
      throw new UnauthorizedException(
        'Confluence token expired; reconnect required',
      );
    }

    const refreshToken = this.encryption.decrypt(connection.refreshTokenEnc);
    const tokens = await this.api.refreshAccessToken(refreshToken);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await this.prisma.confluenceConnection.update({
      where: { id: connectionId },
      data: {
        accessTokenEnc: this.encryption.encrypt(tokens.access_token),
        refreshTokenEnc: tokens.refresh_token
          ? this.encryption.encrypt(tokens.refresh_token)
          : connection.refreshTokenEnc,
        tokenExpiresAt: expiresAt,
        scopes: tokens.scope ?? connection.scopes,
      },
    });

    return tokens.access_token;
  }

  getFrontendRedirectUrl(projectId: string, connected: boolean): string {
    const base = this.config.get<string>(
      'CORS_ORIGIN',
      'http://localhost:5173',
    );
    const status = connected ? 'connected' : 'error';
    return `${base}/projects/${projectId}/settings?tab=integrations&confluence=${status}`;
  }

  isOAuthConfigured(): boolean {
    const clientId = this.config.get<string>('ATLASSIAN_CLIENT_ID', '');
    const clientSecret = this.config.get<string>('ATLASSIAN_CLIENT_SECRET', '');
    return Boolean(clientId && clientSecret);
  }

  getSetupHint(): ConfluenceOAuthSetupHint {
    const redirectUri = this.config.get<string>(
      'ATLASSIAN_REDIRECT_URI',
      'http://localhost:3000/api/v1/integrations/confluence/oauth/callback',
    );
    const scopes = this.config
      .get<string>(
        'ATLASSIAN_SCOPES',
        'read:confluence-content.all read:confluence-space.summary offline_access',
      )
      .split(/\s+/)
      .filter(Boolean);

    return {
      steps: [
        'Open the Atlassian Developer Console and create an OAuth 2.0 (3LO) integration.',
        `Add this callback URL under Authorization → Callback URL: ${redirectUri}`,
        'Enable the Confluence API scopes listed below.',
        'Set ATLASSIAN_CLIENT_ID and ATLASSIAN_CLIENT_SECRET on the API server (see backend/.env.dev.example).',
        'Restart the API, then use Connect Confluence here.',
      ],
      scopes,
      envVars: [
        'ATLASSIAN_CLIENT_ID',
        'ATLASSIAN_CLIENT_SECRET',
        'ATLASSIAN_REDIRECT_URI',
        'ATLASSIAN_SCOPES',
        'CONFLUENCE_TOKEN_ENCRYPTION_KEY',
      ],
      redirectUri,
      docsUrl:
        'https://developer.atlassian.com/cloud/confluence/oauth-2-3lo-apps/',
    };
  }

  assertOAuthConfigured(): void {
    if (!this.isOAuthConfigured()) {
      throw new Error(
        'Atlassian OAuth is not configured (ATLASSIAN_CLIENT_ID / ATLASSIAN_CLIENT_SECRET)',
      );
    }
  }
}
