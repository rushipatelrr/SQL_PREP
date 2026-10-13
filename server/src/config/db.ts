import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env';

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore if not supported
}

mongoose.set('strictQuery', true);

export async function connectDB(uri: string = env.mongodbUri): Promise<typeof mongoose> {
  mongoose.connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[mongo] connection error:', err);
  });

  return mongoose.connect(uri);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
