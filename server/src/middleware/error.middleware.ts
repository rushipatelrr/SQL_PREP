import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/http-errors';
import { SqlGuardError } from '../services/sql-sandbox/query-guard';
import { SqlSandboxError } from '../services/sql-sandbox/sandbox.service';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `No route: ${req.method} ${req.originalUrl}` });
}

// Express detects error-handling middleware by arity, so all four parameters must stay —
// req/next are unused here but required for Express to route errors into this function.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof SqlGuardError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof SqlSandboxError) {
    // Includes SqlSandboxTimeoutError and raw SQL syntax errors from sql.js — both are
    // safe to show the learner as-is, same as the original client-side error message.
    res.status(400).json({ error: err.message });
    return;
  }

  // eslint-disable-next-line no-console
  console.error('[unhandled error]', err);
  res.status(500).json({
    error: 'Something went wrong on our end.',
    ...(env.isProduction ? {} : { detail: err instanceof Error ? err.message : String(err) }),
  });
}
