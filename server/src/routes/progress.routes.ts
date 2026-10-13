import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { updateThemeSchema } from '../validators/progress.validators';
import { getMyProgress, updateTheme } from '../controllers/progress.controller';

const router = Router();

router.get('/me', requireAuth, asyncHandler(getMyProgress));
router.patch('/theme', requireAuth, validateBody(updateThemeSchema), asyncHandler(updateTheme));

export default router;
