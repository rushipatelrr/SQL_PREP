import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-text-dim transition-colors hover:text-text"
    >
      {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
