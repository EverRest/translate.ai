import { ConfigService } from '@nestjs/config';
import { ConfluenceApiClient } from './confluence-api.client';

describe('ConfluenceApiClient', () => {
  const client = new ConfluenceApiClient(
    new ConfigService({
      ATLASSIAN_CLIENT_ID: 'test-client-id',
      ATLASSIAN_CLIENT_SECRET: 'secret',
      ATLASSIAN_REDIRECT_URI:
        'http://localhost:3000/api/v1/integrations/confluence/oauth/callback',
      ATLASSIAN_SCOPES: 'read:confluence-content.all offline_access',
    }),
  );

  it('builds authorize URL with state and scopes', () => {
    const url = new URL(client.getAuthorizeUrl('signed-state-token'));
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
