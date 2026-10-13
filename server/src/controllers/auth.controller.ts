import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { toPublicUser } from '../services/user.service';

/** Called after Passport's Google strategy has already verified the user and set up the session. */
export function googleCallbackSuccess(_req: Request, res: Response): void {
  res.redirect(`${env.clientUrl}/`);
}

export function me(req: Request, res: Response): void {
  // requireAuth has already guaranteed req.user exists.
  res.json({ user: toPublicUser(req.user!) });
}

/**
 * Logout only ever ends the session — it must never delete or modify anything in the
 * Progress collection. Signing back in with the same Google account restores everything.
 */
export function logout(req: Request, res: Response, next: NextFunction): void {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr);
      res.clearCookie('sqlprep.sid');
      res.json({ ok: true });
    });
  });
}
