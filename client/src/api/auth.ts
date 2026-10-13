import { apiFetch, ApiError } from './client';
import type { PublicUser } from '@/types/api';

/** Full-page redirect — Google OAuth is a browser navigation, not a fetch call. */
export function goToGoogleSignIn(): void {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  window.location.href = `${base}/api/auth/google`;
}

/** Returns null (not a thrown error) for the common "not signed in" case, so callers can treat it as normal, expected state. */
export async function fetchMe(): Promise<PublicUser | null> {
  try {
    const data = await apiFetch<{ user: PublicUser }>('/api/auth/me');
    return data.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' });
}
