export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function pollUntil<T>(
  fn: () => Promise<T>,
  isDone: (value: T) => boolean,
  options: { intervalMs: number; maxAttempts: number },
): Promise<T> {
  let lastValue = await fn();

  for (let attempt = 1; attempt < options.maxAttempts; attempt += 1) {
    if (isDone(lastValue)) {
      return lastValue;
    }
    await sleep(options.intervalMs);
    lastValue = await fn();
  }

  if (isDone(lastValue)) {
    return lastValue;
  }

  throw new Error('Timed out waiting for export to complete');
}
