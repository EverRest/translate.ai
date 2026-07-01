import { ConfigService } from '@nestjs/config';
import { AtlassianOAuthCredentialsService } from './atlassian-oauth-credentials.service';
import { ConfluenceApiClient } from './confluence-api.client';

describe('ConfluenceApiClient', () => {
  const credentials = new AtlassianOAuthCredentialsService(
    {
      tenantAtlassianOAuthApp: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as never,
    new ConfigService({
      ATLASSIAN_CLIENT_ID: 'test-client-id',
      ATLASSIAN_CLIENT_SECRET: 'secret',
      ATLASSIAN_REDIRECT_URI:
        'http://localhost:3000/api/v1/integrations/confluence/oauth/callback',
      ATLASSIAN_SCOPES: 'read:confluence-content.all offline_access',
    }),
    { decrypt: jest.fn(), encrypt: jest.fn() } as never,
  );

  const client = new ConfluenceApiClient(credentials);

  it('builds authorize URL with state and scopes', async () => {
    const url = new URL(await client.getAuthorizeUrl('signed-state-token'));
    expect(url.origin + url.pathname).toBe(
      'https://auth.atlassian.com/authorize',
    );
    expect(url.searchParams.get('client_id')).toBe('test-client-id');
    expect(url.searchParams.get('state')).toBe('signed-state-token');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3000/api/v1/integrations/confluence/oauth/callback',
    );
    expect(url.searchParams.get('scope')).toContain(
      'read:confluence-content.all',
    );
  });
});
