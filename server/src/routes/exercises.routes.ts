import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { submitRateLimiter } from '../middleware/rateLimit.middleware';
import { submitExerciseSchema, hintRequestSchema } from '../validators/exercise.validators';
import { asyncHandler } from '../utils/asyncHandler';
import * as exercisesController from '../controllers/exercises.controller';

const router = Router();

router.use(requireAuth);

router.get('/:exerciseId', asyncHandler(exercisesController.getExercise));

router.post(
  '/:exerciseId/submit',
  submitRateLimiter,
  validateBody(submitExerciseSchema),
  asyncHandler(exercisesController.submitExerciseHandler)
);

router.post('/:exerciseId/hint', validateBody(hintRequestSchema), asyncHandler(exercisesController.getHintHandler));

router.post(
  '/:exerciseId/reveal-solution',
  validateBody(hintRequestSchema),
  asyncHandler(exercisesController.revealSolutionHandler)
);

export default router;
