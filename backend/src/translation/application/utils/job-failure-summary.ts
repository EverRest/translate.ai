export type JobFailureSummary = {
  summary: string;
  hint: string;
  sampleErrors: string[];
};

function normalizeError(error: string): string {
  return error.replace(/\s+/g, ' ').trim();
}

function truncate(error: string, max = 240): string {
  const value = normalizeError(error);
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

export function buildJobFailureSummary(
  errors: string[],
  provider: string | null,
): JobFailureSummary | null {
  const unique = [
    ...new Set(errors.map(normalizeError).filter((value) => value.length > 0)),
  ];
  if (unique.length === 0) {
    return null;
  }

  const combined = unique.join(' ').toLowerCase();
  const sampleErrors = unique.slice(0, 3).map((error) => truncate(error));

  if (
    combined.includes('on conflict') ||
    combined.includes('translationmemory') ||
    combined.includes('translation_memory')
  ) {
    return {
      summary: 'Database error while saving translation memory.',
      hint: 'Apply pending migrations (`npx prisma migrate deploy`), restart the worker, then Retry.',
      sampleErrors,
    };
  }

  if (
    combined.includes('abort') ||
    combined.includes('timed out') ||
    combined.includes('timeout') ||
    combined.includes('this operation was aborted')
  ) {
    return {
      summary:
        provider === 'ollama'
          ? 'Ollama request timed out.'
          : 'AI provider request timed out.',
      hint:
        provider === 'ollama'
          ? 'Increase OLLAMA_TIMEOUT_MS, use a smaller model, or Retry when Ollama is idle.'
          : 'Check provider latency and retry failed items.',
      sampleErrors,
    };
  }

  if (
    combined.includes('econnrefused') ||
    combined.includes('fetch failed') ||
    combined.includes('providerunavailable') ||
    combined.includes('http 404') ||
    combined.includes('empty response')
  ) {
    if (provider === 'ollama' || combined.includes('ollama')) {
      return {
        summary: 'Could not reach Ollama or the configured model.',
        hint: 'Start Ollama.app, run `ollama pull llama3.2:3b`, set OLLAMA_BASE_URL=http://127.0.0.1:11434, restart worker.',
        sampleErrors,
      };
    }

    return {
      summary: 'AI provider is unavailable.',
      hint: 'Check API keys, provider status, and AI_PROVIDER_FALLBACK settings, then Retry.',
      sampleErrors,
    };
  }

  if (
    combined.includes('api key') ||
    combined.includes('unauthorized') ||
    combined.includes('invalid api')
  ) {
    return {
      summary: 'AI provider authentication failed.',
      hint: 'Set the provider API key in backend `.env` and restart API/worker.',
      sampleErrors,
    };
  }

  if (
    combined.includes('validation failed') ||
    combined.includes('refusal') ||
    combined.includes('identical to source')
  ) {
    return {
      summary: 'AI translation output failed quality checks.',
      hint: 'Review key context/content type, try Retranslate from Approvals, or Retry the job after fixing prompts.',
      sampleErrors,
    };
  }

  return {
    summary: truncate(unique[0], 160),
    hint: 'Check worker logs for details, fix the underlying issue, then Retry failed items.',
    sampleErrors,
  };
}
