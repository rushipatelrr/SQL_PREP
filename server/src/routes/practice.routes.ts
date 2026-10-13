import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { startPractice } from '../controllers/practice.controller';

const router = Router();

router.post('/:levelId/start', requireAuth, asyncHandler(startPractice));

export default router;
