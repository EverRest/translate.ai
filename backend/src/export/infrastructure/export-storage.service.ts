import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

@Injectable()
export class ExportStorageService {
  constructor(private readonly config: ConfigService) {}

  private baseDir(): string {
    return this.config.get<string>('EXPORT_STORAGE_DIR', '.exports');
  }

  async writeExportFile(
    tenantId: string,
    exportJobId: string,
    filename: string,
    content: string,
  ): Promise<string> {
    const dir = path.join(this.baseDir(), tenantId, exportJobId);
    await mkdir(dir, { recursive: true });
    const storagePath = path.join(dir, filename);
    await writeFile(storagePath, content, 'utf8');
    return storagePath;
  }

  async readExportFile(storagePath: string): Promise<string> {
    return readFile(storagePath, 'utf8');
  }
}
