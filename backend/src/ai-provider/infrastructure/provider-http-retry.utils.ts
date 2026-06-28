export const TRANSIENT_HTTP_STATUSES = new Set([502, 503, 429]);

export function isTransientHttpStatus(status: number): boolean {
  return TRANSIENT_HTTP_STATUSES.has(status);
}

export function computeRetryDelayMs(
  retryIndex: number,
  baseMs: number,
): number {
  return baseMs * 2 ** retryIndex;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function parseHttpStatusFromProviderError(
  message: string,
): number | null {
  const match = message.match(/HTTP (\d{3})/i);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[1], 10);
}
