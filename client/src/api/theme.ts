import { apiFetch } from './client';
import type { Theme } from '@/stores/themeStore';

export async function syncThemePreference(theme: Theme): Promise<void> {
  await apiFetch('/api/progress/theme', { method: 'PATCH', body: { theme } });
}
