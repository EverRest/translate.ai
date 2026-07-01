import type { ImportSourceType } from './import-document.types';

const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

export interface DetectedFormat {
  sourceType: ImportSourceType;
  mimeHint?: string;
}

export function detectImportFormat(
  buffer: Buffer,
  filename?: string,
  explicitType?: string,
): DetectedFormat {
  if (explicitType === 'paste_html') {
    return { sourceType: 'paste_html', mimeHint: 'text/html' };
  }

  const lowerName = filename?.toLowerCase() ?? '';
  if (lowerName.endsWith('.zip') || buffer.subarray(0, 4).equals(ZIP_MAGIC)) {
    return { sourceType: 'confluence_zip', mimeHint: 'application/zip' };
  }
  if (lowerName.endsWith('.csv')) {
    return { sourceType: 'confluence_csv', mimeHint: 'text/csv' };
  }
  if (
    lowerName.endsWith('.html') ||
    lowerName.endsWith('.htm') ||
    looksLikeHtml(buffer)
  ) {
    return { sourceType: 'confluence_html', mimeHint: 'text/html' };
  }

  const text = buffer.toString('utf8', 0, Math.min(buffer.length, 4096)).trim();
  if (looksLikeHtmlBuffer(text)) {
    return { sourceType: 'confluence_html', mimeHint: 'text/html' };
  }
  if (looksLikeCsv(text)) {
    return { sourceType: 'confluence_csv', mimeHint: 'text/csv' };
  }

  throw new Error(
    'Unsupported import format. Upload Confluence HTML, CSV, or ZIP export.',
  );
}

function looksLikeHtml(buffer: Buffer): boolean {
  const head = buffer.toString('utf8', 0, Math.min(buffer.length, 256)).trim();
  return looksLikeHtmlBuffer(head);
}

function looksLikeHtmlBuffer(text: string): boolean {
  return (
    /^<!DOCTYPE html/i.test(text) ||
    /^<html/i.test(text) ||
    /<table/i.test(text)
  );
}

function looksLikeCsv(text: string): boolean {
  const firstLine = text.split(/\r?\n/)[0] ?? '';
  return firstLine.includes(',') && /scope|key|default|hint/i.test(firstLine);
}
