import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  trustProxy: process.env.TRUST_PROXY === 'true',

  mongodbUri: required('MONGODB_URI'),

  googleClientId: required('GOOGLE_CLIENT_ID'),
  googleClientSecret: required('GOOGLE_CLIENT_SECRET'),
  googleCallbackUrl: required('GOOGLE_CALLBACK_URL'),

  sessionSecret: required('SESSION_SECRET'),

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
