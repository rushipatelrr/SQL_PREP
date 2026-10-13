import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import * as levelsController from '../controllers/levels.controller';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(levelsController.listLevels));
router.get('/:levelId', asyncHandler(levelsController.getLevel));

export default router;
