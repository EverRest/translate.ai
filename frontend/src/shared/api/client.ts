import { useAuthStore } from '../../features/auth/store/auth.store';
import { parseContentDispositionFilename } from './download.utils';
import { ApiError, type ApiSuccess } from './types';

export { ApiError, type ApiSuccess };

const baseUrl = import.meta.env.VITE_API_URL ?? '/api/v1';

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return {} as T;
  }

  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new ApiError(
      body.message ?? body.error ?? `API error: ${response.status}`,
      response.status,
    );
  }

  return body as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      ...authHeaders(),
    },
  });
  return parseResponse<T>(response);
}

export async function apiPost<T, B = unknown>(
  path: string,
  body?: B,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

export async function apiPatch<T, B = unknown>(
  path: string,
  body: B,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

export async function apiPut<T, B = unknown>(
  path: string,
  body: B,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  });
  return parseResponse<T>(response);
}

export async function apiDownload(
  path: string,
  fallbackFilename = 'download',
): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    throw new ApiError(
      body.message ?? body.error ?? `API error: ${response.status}`,
      response.status,
    );
  }

  const blob = await response.blob();
  const filename = parseContentDispositionFilename(
    response.headers.get('Content-Disposition'),
    fallbackFilename,
  );

  return { blob, filename };
}
