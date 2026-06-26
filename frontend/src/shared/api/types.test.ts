import { describe, expect, it } from 'vitest';
import { ApiError } from '../api/types';

describe('ApiError', () => {
  it('stores message and status', () => {
    const error = new ApiError('Unauthorized', 401);
    expect(error.message).toBe('Unauthorized');
    expect(error.status).toBe(401);
    expect(error.name).toBe('ApiError');
  });
});
