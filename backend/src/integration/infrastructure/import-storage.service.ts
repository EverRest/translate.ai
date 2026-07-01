import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

@Injectable()
export class ImportStorageService {
  constructor(private readonly config: ConfigService) {}

  private baseDir(): string {
    return this.config.get<string>('IMPORT_STORAGE_DIR', '.imports');
  }

  async writeImportFile(
    tenantId: string,
    sessionId: string,
    filename: string,
    content: Buffer,
  ): Promise<string> {
    const dir = path.join(this.baseDir(), tenantId, sessionId);
    await mkdir(dir, { recursive: true });
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = path.join(dir, safeName);
    await writeFile(storagePath, content);
    return storagePath;
  }

  async writeHtmlContent(
    tenantId: string,
    sessionId: string,
    html: string,
  ): Promise<string> {
    return this.writeImportFile(
      tenantId,
      sessionId,
      'paste.html',
      Buffer.from(html, 'utf8'),
    );
  }

  async readImportFile(storagePath: string): Promise<Buffer> {
    return readFile(storagePath);
  }
}
