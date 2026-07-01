import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ConfluenceApiClient } from '../infrastructure/confluence-api.client';
import { ConfluenceOAuthService } from './confluence-oauth.service';
import { normalizeHtmlTable } from '../domain/table-normalizer';
import type {
  ImportDocument,
  ImportRow,
  ImportSourcePage,
  ImportWarning,
  ParseRules,
} from '../domain/import-document.types';

@Injectable()
export class ConfluenceFetchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly api: ConfluenceApiClient,
    private readonly oauth: ConfluenceOAuthService,
  ) {}

  async fetchPagesAsDocument(
    connectionId: string,
    pageIds: string[],
    parseRules?: ParseRules,
  ): Promise<ImportDocument> {
    const connection = await this.prisma.confluenceConnection.findUniqueOrThrow(
      { where: { id: connectionId } },
    );
    const accessToken = await this.oauth.getValidAccessToken(connectionId);

    const allRows: ImportRow[] = [];
    const warnings: ImportWarning[] = [];
    const sourcePages: ImportSourcePage[] = [];
    const seenKeys = new Map<string, string>();

    for (const pageId of pageIds) {
      const page = await this.api.getPageContent(
        connection.cloudId,
        pageId,
        accessToken,
      );
      const externalPrefix = `confluence:page:${pageId}`;
      const { rows, warnings: pageWarnings } = normalizeHtmlTable(
        page.bodyHtml,
        parseRules?.columnMapping,
        externalPrefix,
      );

      for (const row of rows) {
        row.externalSource = 'confluence';
        row.externalId = row.externalId ?? `${externalPrefix}#${row.key}`;
        const existing = seenKeys.get(row.key);
        if (existing) {
          warnings.push({
            code: 'DUPLICATE_KEY',
            message: `Duplicate key "${row.key}" on page ${page.title} (first: ${existing})`,
            externalId: row.externalId,
          });
        } else {
          seenKeys.set(row.key, page.title);
        }
      }

      allRows.push(...rows);
      warnings.push(...pageWarnings);
      sourcePages.push({
        filename: pageId,
        title: page.title,
        keyCount: rows.length,
      });
    }

    return {
      rows: allRows,
      warnings,
      stats: {
        totalRows: allRows.length,
        validRows: allRows.length,
        pageCount: sourcePages.length,
      },
      sourcePages,
    };
  }

  async listSpaces(connectionId: string) {
    const connection = await this.prisma.confluenceConnection.findUniqueOrThrow(
      { where: { id: connectionId } },
    );
    const accessToken = await this.oauth.getValidAccessToken(connectionId);
    return this.api.listSpaces(connection.cloudId, accessToken);
  }

  async listPages(connectionId: string, spaceId: string) {
    const connection = await this.prisma.confluenceConnection.findUniqueOrThrow(
      { where: { id: connectionId } },
    );
    const accessToken = await this.oauth.getValidAccessToken(connectionId);
    return this.api.listPagesInSpace(connection.cloudId, spaceId, accessToken);
  }
}
