import type { ApiErrorBody } from '@/types/api';

// Empty string means "same origin as the page" — correct both for the Vite dev proxy
// (see vite.config.ts) and for a production build served behind the same reverse proxy as
// the API. Set VITE_API_BASE_URL only when the client and API are genuinely cross-origin.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: opts.method ?? 'GET',
    credentials: 'include', // always send the session cookie
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as ApiErrorBody;
      if (body.error) message = body.error;
    } catch {
      // Response wasn't JSON — keep the generic message.
    }
    throw new ApiError(res.status, message);
  }

  // 204 / empty-body responses (none today, but cheap to guard against).
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
