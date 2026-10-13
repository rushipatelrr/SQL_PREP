import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { fetchProgress, startPractice } from '@/api/progress';
import { syncThemePreference } from '@/api/theme';
import { queryKeys } from '@/api/queryKeys';
import { useThemeStore } from '@/stores/themeStore';
import { useMe } from './useAuth';

export function useProgress() {
  const { data: user } = useMe();
  return useQuery({
    queryKey: queryKeys.progress,
    queryFn: fetchProgress,
    enabled: Boolean(user),
  });
}

export function useStartPractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startPractice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progress });
    },
  });
}

/**
 * One-way sync, local -> account, on sign-in and on every toggle: the theme store is
 * always the source of truth for what's on screen (instant, no network dependency), and
 * this just best-effort mirrors it to the account so it can resume on another device. A
 * failed sync is silently ignored — it never blocks or flickers the UI.
 */
export function useThemeAccountSync(): void {
  const { data: user } = useMe();
  const { data: progress } = useProgress();
  const theme = useThemeStore((s) => s.theme);
  const appliedRemote = useRef(false);

  // Once, when progress first loads with a saved preference, adopt it (e.g. signing in on
  // a new device). After that, local toggles are what drive things.
  useEffect(() => {
    if (!appliedRemote.current && progress?.themePreference) {
      useThemeStore.getState().setTheme(progress.themePreference);
      appliedRemote.current = true;
    }
  }, [progress?.themePreference]);

  useEffect(() => {
    if (user) syncThemePreference(theme).catch(() => undefined);
  }, [user, theme]);
}
