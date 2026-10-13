import type { Config } from 'tailwindcss';

// Every color/font value here is lifted directly from the original sql-prep.html's :root
// custom properties — this is a preservation of the existing visual identity, not a
// redesign. See src/index.css for the CSS variables these map onto (dark by default,
// overridden under [data-theme="light"]).
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        panel: 'var(--panel)',
        panel2: 'var(--panel-2)',
        line: 'var(--line)',
        text: 'var(--text)',
        'text-dim': 'var(--text-dim)',
        amber: 'var(--amber)',
        cyan: 'var(--cyan)',
        green: 'var(--green)',
        red: 'var(--red)',
        purple: 'var(--purple)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '10px',
      },
      keyframes: {
        swapIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'swap-in': 'swapIn .28s ease',
      },
    },
  },
  plugins: [],
} satisfies Config;
