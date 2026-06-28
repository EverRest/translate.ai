import { describe, expect, it, vi } from 'vitest';
import { pollUntil } from './poll-until';

describe('pollUntil', () => {
  it('returns immediately when condition is met', async () => {
    const fn = vi.fn().mockResolvedValue('done');
    const result = await pollUntil(fn, (value) => value === 'done', {
      intervalMs: 10,
      maxAttempts: 3,
    });
    expect(result).toBe('done');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('polls until condition is met', async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce('pending')
      .mockResolvedValueOnce('completed');
    const result = await pollUntil(fn, (value) => value === 'completed', {
      intervalMs: 1,
      maxAttempts: 5,
    });
    expect(result).toBe('completed');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
