import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AtlassianAccessibleResource,
  ConfluenceApiClient,
} from '../infrastructure/confluence-api.client';
import { AtlassianOAuthCredentialsService } from '../infrastructure/atlassian-oauth-credentials.service';
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
  credentialSource: 'tenant' | 'platform' | 'none';
}

interface PendingOAuthPayload {
  type: 'confluence_oauth_pending';
  oauthState: ConfluenceOAuthState;
  accessTokenEnc: string;
  refreshTokenEnc: string | null;
  tokenExpiresAt: string;
  scopes: string | null;
  sites: Array<{ id: string; name: string; url: string }>;
}

export type ConfluenceOAuthCallbackResult =
  | { type: 'connected'; projectId: string; siteName: string }
  | {
      type: 'pick_site';
      projectId: string;
      pendingToken: string;
      sites: Array<{ id: string; name: string; url: string }>;
    };

@Injectable()
export class ConfluenceOAuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly api: ConfluenceApiClient,
    private readonly credentials: AtlassianOAuthCredentialsService,
    private readonly encryption: TokenEncryptionService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async createAuthorizeUrl(state: ConfluenceOAuthState): Promise<string> {
    await this.assertOAuthConfigured(state.tenantId);
    const token = this.jwt.sign(state, { expiresIn: '15m' });
    return this.api.getAuthorizeUrl(token, state.tenantId);
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
  ): Promise<ConfluenceOAuthCallbackResult> {
    const oauthState = this.verifyState(state);
    await this.assertOAuthConfigured(oauthState.tenantId);
    const tokens = await this.api.exchangeCode(code, oauthState.tenantId);
    const resources = await this.api.getAccessibleResources(
      tokens.access_token,
    );
    const confluenceSites = this.filterConfluenceResources(resources);

    if (confluenceSites.length === 0) {
      throw new Error('No Confluence site found for this Atlassian account');
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const tokenBundle = {
      accessTokenEnc: this.encryption.encrypt(tokens.access_token),
      refreshTokenEnc: tokens.refresh_token
        ? this.encryption.encrypt(tokens.refresh_token)
        : null,
      tokenExpiresAt: expiresAt.toISOString(),
      scopes: tokens.scope ?? null,
    };

    if (confluenceSites.length === 1) {
      const site = confluenceSites[0];
      await this.persistConnection(oauthState, site, tokenBundle);
      return {
        type: 'connected',
        projectId: oauthState.projectId,
        siteName: site.name,
      };
    }

    const pendingToken = this.jwt.sign(
      {
        type: 'confluence_oauth_pending',
        oauthState,
        ...tokenBundle,
        sites: confluenceSites.map((site) => ({
          id: site.id,
          name: site.name,
          url: site.url,
        })),
      } satisfies PendingOAuthPayload,
      { expiresIn: '15m' },
    );

    return {
      type: 'pick_site',
      projectId: oauthState.projectId,
      pendingToken,
      sites: confluenceSites.map((site) => ({
        id: site.id,
        name: site.name,
        url: site.url,
      })),
    };
  }

  async completePendingConnection(
    pendingToken: string,
    cloudId: string,
  ): Promise<{ projectId: string; siteName: string }> {
    const payload = this.verifyPendingToken(pendingToken);
    const site = payload.sites.find((item) => item.id === cloudId);
    if (!site) {
      throw new UnauthorizedException('Invalid Confluence site selection');
    }

    await this.persistConnection(
      payload.oauthState,
      { id: site.id, name: site.name, url: site.url, scopes: [] },
      {
        accessTokenEnc: payload.accessTokenEnc,
        refreshTokenEnc: payload.refreshTokenEnc,
        tokenExpiresAt: payload.tokenExpiresAt,
        scopes: payload.scopes,
      },
    );

    return { projectId: payload.oauthState.projectId, siteName: site.name };
  }

  getPendingSites(pendingToken: string): Array<{
    id: string;
    name: string;
    url: string;
  }> {
    return this.verifyPendingToken(pendingToken).sites;
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
    const tokens = await this.api.refreshAccessToken(
      refreshToken,
      connection.tenantId,
    );
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

  getFrontendRedirectUrl(
    projectId: string,
    status: 'connected' | 'error' | 'pick_site',
    pendingToken?: string,
  ): string {
    const base = this.config.get<string>(
      'CORS_ORIGIN',
      'http://localhost:5173',
    );
    const origin = base.split(',')[0]?.trim() ?? base;
    const params = new URLSearchParams({
      tab: 'integrations',
      confluence: status,
    });
    if (status === 'pick_site' && pendingToken) {
      params.set('pendingToken', pendingToken);
    }
    return `${origin}/projects/${projectId}/settings?${params.toString()}`;
  }

  async isOAuthConfigured(tenantId?: string): Promise<boolean> {
    return this.credentials.isConfigured(tenantId);
  }

  async getSetupHint(tenantId?: string): Promise<ConfluenceOAuthSetupHint> {
    const creds = await this.credentials.resolve(tenantId);
    const redirectUri =
      creds?.redirectUri ??
      this.config.get<string>(
        'ATLASSIAN_REDIRECT_URI',
        'http://localhost:3000/api/v1/integrations/confluence/oauth/callback',
      );
    const scopes =
      creds?.scopes ??
      this.config
        .get<string>(
          'ATLASSIAN_SCOPES',
          'read:confluence-content.all read:confluence-space.summary offline_access',
        )
        .split(/\s+/)
        .filter(Boolean);

    if (creds?.source === 'tenant') {
      return {
        steps: [
          'This tenant uses a custom Atlassian OAuth app (BYO credentials).',
          `Ensure the callback URL is registered: ${redirectUri}`,
          'Reconnect Confluence from Project Settings → Integrations if credentials were updated.',
        ],
        scopes,
        envVars: [],
        redirectUri,
        docsUrl:
          'https://developer.atlassian.com/cloud/confluence/oauth-2-3lo-apps/',
        credentialSource: 'tenant',
      };
    }

    return {
      steps: [
        'Open the Atlassian Developer Console and create an OAuth 2.0 (3LO) integration.',
        `Add this callback URL under Authorization → Callback URL: ${redirectUri}`,
        'Enable the Confluence API scopes listed below.',
        'Set ATLASSIAN_CLIENT_ID and ATLASSIAN_CLIENT_SECRET on the API server (see backend/.env.dev.example).',
        'Alternatively, configure tenant BYO OAuth under Tenant Settings (admin only).',
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
      credentialSource: creds ? 'platform' : 'none',
    };
  }

  async assertOAuthConfigured(tenantId?: string): Promise<void> {
    if (!(await this.isOAuthConfigured(tenantId))) {
      throw new Error(
        'Atlassian OAuth is not configured (ATLASSIAN_CLIENT_ID / ATLASSIAN_CLIENT_SECRET or tenant BYO app)',
      );
    }
  }

  private verifyPendingToken(pendingToken: string): PendingOAuthPayload {
    try {
      const payload = this.jwt.verify<PendingOAuthPayload>(pendingToken);
      if (payload.type !== 'confluence_oauth_pending') {
        throw new Error('invalid pending token');
      }
      return payload;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired site selection token',
      );
    }
  }

  private filterConfluenceResources(
    resources: AtlassianAccessibleResource[],
  ): AtlassianAccessibleResource[] {
    return resources.filter((resource) =>
      resource.scopes.some((scope) => scope.includes('confluence')),
    );
  }

  private async persistConnection(
    oauthState: ConfluenceOAuthState,
    site: { id: string; name: string; url: string; scopes: string[] },
    tokens: {
      accessTokenEnc: string;
      refreshTokenEnc: string | null;
      tokenExpiresAt: string;
      scopes: string | null;
    },
  ) {
    const connection = await this.prisma.confluenceConnection.upsert({
      where: { projectId: oauthState.projectId },
      create: {
        tenantId: oauthState.tenantId,
        projectId: oauthState.projectId,
        cloudId: site.id,
        siteUrl: site.url,
        siteName: site.name,
        accessTokenEnc: tokens.accessTokenEnc,
        refreshTokenEnc: tokens.refreshTokenEnc,
        tokenExpiresAt: new Date(tokens.tokenExpiresAt),
        scopes: tokens.scopes,
        connectedById: oauthState.userId,
      },
      update: {
        cloudId: site.id,
        siteUrl: site.url,
        siteName: site.name,
        accessTokenEnc: tokens.accessTokenEnc,
        refreshTokenEnc: tokens.refreshTokenEnc,
        tokenExpiresAt: new Date(tokens.tokenExpiresAt),
        scopes: tokens.scopes,
        connectedById: oauthState.userId,
      },
    });

    await this.prisma.confluenceSyncConfig.upsert({
      where: { connectionId: connection.id },
      create: { connectionId: connection.id, pageIds: [] },
      update: {},
    });
  }
}
