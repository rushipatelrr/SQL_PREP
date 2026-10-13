import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/http-errors';

/**
 * The only source of truth for "who is making this request" is req.user, which Passport
 * populates from the encrypted, server-side session — never from a client-supplied field
 * like a body/query `userId`. Every progress-related route uses this.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    next(new UnauthorizedError());
    return;
  }
  next();
}
