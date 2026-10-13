import { Router } from 'express';
import passport from 'passport';
import { env } from '../config/env';
import { requireAuth } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.get('/google', authRateLimiter, passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  authRateLimiter,
  passport.authenticate('google', { failureRedirect: `${env.clientUrl}/login?error=auth_failed` }),
  authController.googleCallbackSuccess
);

router.get('/me', requireAuth, authController.me);
router.post('/logout', requireAuth, authController.logout);

export default router;
