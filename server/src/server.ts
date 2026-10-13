import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function main(): Promise<void> {
  await connectDB();
  // eslint-disable-next-line no-console
  console.log('[mongo] connected');

  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[startup] failed to start server:', err);
  process.exit(1);
});
