import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConfluenceFetchService } from './confluence-fetch.service';
import type { ConfluenceApiClient } from '../infrastructure/confluence-api.client';
import type { ConfluenceOAuthService } from './confluence-oauth.service';
import type { PrismaService } from '../../shared/prisma/prisma.service';

const sampleHtml = readFileSync(
  join(__dirname, '../../../test/fixtures/confluence/sample.html'),
  'utf8',
);

describe('ConfluenceFetchService', () => {
  const prisma = {
    confluenceConnection: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'conn-1',
        cloudId: 'cloud-abc',
      }),
    },
  } as unknown as PrismaService;

  const api = {
    getPageContent: jest.fn().mockResolvedValue({
      id: 'page-1',
      title: 'Translations - Login',
      bodyHtml: sampleHtml,
    }),
  } as unknown as ConfluenceApiClient;

  const oauth = {
    getValidAccessToken: jest.fn().mockResolvedValue('access-token'),
  } as unknown as ConfluenceOAuthService;

  const service = new ConfluenceFetchService(prisma, api, oauth);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches pages and normalizes HTML tables into ImportDocument', async () => {
    const doc = await service.fetchPagesAsDocument('conn-1', ['page-1']);

    expect(oauth.getValidAccessToken).toHaveBeenCalledWith('conn-1');
    expect(api.getPageContent).toHaveBeenCalledWith(
      'cloud-abc',
      'page-1',
      'access-token',
    );
    expect(doc.rows).toHaveLength(3);
    expect(doc.rows[0]).toMatchObject({
      key: 'login.title',
      sourceText: 'Sign in',
      externalSource: 'confluence',
    });
    expect(doc.stats.totalRows).toBe(3);
    expect(doc.sourcePages).toEqual([
      { filename: 'page-1', title: 'Translations - Login', keyCount: 3 },
    ]);
  });
});
