import { create } from 'zustand';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'sqlprep.theme';

function applyThemeToDocument(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

function readInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * Theme is local-first by design: it applies instantly on toggle and persists across
 * refreshes via localStorage, with no dependency on being signed in or on a network round
 * trip. useThemeSync (hooks/useTheme.ts) layers account-level persistence on top of this
 * once a user is authenticated — see spec section 20 ("optionally persist... as well").
 */
export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = typeof window !== 'undefined' ? readInitialTheme() : 'dark';
  if (typeof document !== 'undefined') applyThemeToDocument(initial);

  return {
    theme: initial,
    setTheme: (theme) => {
      localStorage.setItem(STORAGE_KEY, theme);
      applyThemeToDocument(theme);
      set({ theme });
    },
    toggleTheme: () => {
      const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(next);
    },
  };
});
