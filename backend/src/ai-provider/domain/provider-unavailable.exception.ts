export class ProviderUnavailableException extends Error {
  constructor(provider: string, cause?: string) {
    super(`AI provider unavailable: ${provider}${cause ? ` (${cause})` : ''}`);
    this.name = 'ProviderUnavailableException';
  }
}
