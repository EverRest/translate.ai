import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AtlassianAccessibleResource {
  id: string;
  url: string;
  name: string;
  scopes: string[];
}

export interface ConfluenceSpace {
  id: string;
  key: string;
  name: string;
}

export interface ConfluencePageSummary {
  id: string;
  title: string;
  spaceId?: string;
}

export interface ConfluencePageContent {
  id: string;
  title: string;
  bodyHtml: string;
}

export interface ConfluenceTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

@Injectable()
export class ConfluenceApiClient {
  private readonly logger = new Logger(ConfluenceApiClient.name);

  constructor(private readonly config: ConfigService) {}

  getAuthorizeUrl(state: string): string {
    const clientId = this.config.get<string>('ATLASSIAN_CLIENT_ID', '');
    const redirectUri = this.redirectUri();
    const scopes = this.scopes().join(' ');
    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      state,
      response_type: 'code',
      prompt: 'consent',
    });
    return `https://auth.atlassian.com/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<ConfluenceTokenResponse> {
    return this.postToken({
      grant_type: 'authorization_code',
      client_id: this.config.get<string>('ATLASSIAN_CLIENT_ID', ''),
      client_secret: this.config.get<string>('ATLASSIAN_CLIENT_SECRET', ''),
      code,
      redirect_uri: this.redirectUri(),
    });
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<ConfluenceTokenResponse> {
    return this.postToken({
      grant_type: 'refresh_token',
      client_id: this.config.get<string>('ATLASSIAN_CLIENT_ID', ''),
      client_secret: this.config.get<string>('ATLASSIAN_CLIENT_SECRET', ''),
      refresh_token: refreshToken,
    });
  }

  async getAccessibleResources(
    accessToken: string,
  ): Promise<AtlassianAccessibleResource[]> {
    const response = await fetch(
      'https://api.atlassian.com/oauth/token/accessible-resources',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!response.ok) {
      throw new Error(
        `Atlassian accessible-resources failed: ${response.status}`,
      );
    }
    return (await response.json()) as AtlassianAccessibleResource[];
  }

  async listSpaces(
    cloudId: string,
    accessToken: string,
  ): Promise<ConfluenceSpace[]> {
    const data = await this.getJson<{ results: ConfluenceSpace[] }>(
      cloudId,
      '/wiki/api/v2/spaces?limit=50',
      accessToken,
    );
    return data.results ?? [];
  }

  async listPagesInSpace(
    cloudId: string,
    spaceId: string,
    accessToken: string,
  ): Promise<ConfluencePageSummary[]> {
    const data = await this.getJson<{ results: ConfluencePageSummary[] }>(
      cloudId,
      `/wiki/api/v2/spaces/${spaceId}/pages?limit=100`,
      accessToken,
    );
    return data.results ?? [];
  }

  async getPageContent(
    cloudId: string,
    pageId: string,
    accessToken: string,
  ): Promise<ConfluencePageContent> {
    const data = await this.getJson<{
      id: string;
      title: string;
      body?: { storage?: { value?: string } };
    }>(
      cloudId,
      `/wiki/api/v2/pages/${pageId}?body-format=storage`,
      accessToken,
    );
    return {
      id: data.id,
      title: data.title,
      bodyHtml: data.body?.storage?.value ?? '',
    };
  }

  private async postToken(
    body: Record<string, string>,
  ): Promise<ConfluenceTokenResponse> {
    const response = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Atlassian token exchange failed: ${response.status} ${text}`,
      );
    }
    return (await response.json()) as ConfluenceTokenResponse;
  }

  private async getJson<T>(
    cloudId: string,
    path: string,
    accessToken: string,
    attempt = 0,
  ): Promise<T> {
    const url = `https://api.atlassian.com/ex/confluence/${cloudId}${path}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get('retry-after') ?? '2');
      this.logger.warn(`Confluence rate limit, retry in ${retryAfter}s`);
      await sleep(retryAfter * 1000);
      return this.getJson<T>(cloudId, path, accessToken, attempt + 1);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Confluence API ${path} failed: ${response.status} ${text}`,
      );
    }

    return (await response.json()) as T;
  }

  private redirectUri(): string {
    return this.config.get<string>(
      'ATLASSIAN_REDIRECT_URI',
      'http://localhost:3000/api/v1/integrations/confluence/oauth/callback',
    );
  }

  private scopes(): string[] {
    const raw = this.config.get<string>(
      'ATLASSIAN_SCOPES',
      'read:confluence-content.all read:confluence-space.summary offline_access',
    );
    return raw.split(/\s+/).filter(Boolean);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
