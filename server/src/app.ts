import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import { env } from './config/env';
import { configurePassport } from './config/passport';
import apiRoutes from './routes';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function createApp(): Express {
  configurePassport();

  const app = express();

  if (env.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '100kb' }));

  if (!env.isProduction) {
    app.use(morgan('dev'));
  }

  app.use(
    session({
      name: 'sqlprep.sid',
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: env.mongodbUri, collectionName: 'sessions' }),
      cookie: {
        httpOnly: true,
        secure: env.isProduction, // requires HTTPS in production — see TRUST_PROXY in .env.example
        sameSite: env.isProduction ? 'none' : 'lax',
        maxAge: SESSION_MAX_AGE_MS,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
