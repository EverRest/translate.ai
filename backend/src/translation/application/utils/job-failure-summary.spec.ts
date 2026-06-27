import { buildJobFailureSummary } from './job-failure-summary';

describe('buildJobFailureSummary', () => {
  it('detects translation memory database errors', () => {
    const result = buildJobFailureSummary(
      [
        'Invalid `prisma.translationMemory.upsert()` invocation: ON CONFLICT specification',
      ],
      'ollama',
    );

    expect(result?.summary).toContain('translation memory');
    expect(result?.hint).toContain('migrate deploy');
  });

  it('detects ollama timeout errors', () => {
    const result = buildJobFailureSummary(
      ['This operation was aborted'],
      'ollama',
    );

    expect(result?.summary).toContain('timed out');
    expect(result?.hint).toContain('OLLAMA_TIMEOUT_MS');
  });

  it('detects ollama connectivity errors', () => {
    const result = buildJobFailureSummary(
      ['ProviderUnavailableException: ollama — fetch failed'],
      'ollama',
    );

    expect(result?.summary).toContain('Ollama');
    expect(result?.hint).toContain('127.0.0.1:11434');
  });

  it('returns null when there are no errors', () => {
    expect(buildJobFailureSummary([], 'ollama')).toBeNull();
  });
});
