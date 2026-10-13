import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxying /api means the browser only ever talks to the Vite dev server's own origin —
// the session cookie is first-party from the browser's point of view, sidestepping cross-
// origin cookie edge cases entirely. In production, serve the built client from behind the
// same reverse proxy as the API (or set VITE_API_BASE_URL and rely on the server's CORS
// config in src/app.ts instead).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirrors tsconfig.json's "paths": {"@/*": ["src/*"]} — tsconfig's paths field only
      // affects the TypeScript type-checker/editor experience, never Vite's own module
      // resolution, so this alias has to be declared separately or every `@/...` import
      // would resolve fine to tsc but fail outright at dev/build time.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
