import { Router } from 'express';
import authRoutes from './auth.routes';
import levelsRoutes from './levels.routes';
import exercisesRoutes from './exercises.routes';
import progressRoutes from './progress.routes';
import practiceRoutes from './practice.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/levels', levelsRoutes);
router.use('/exercises', exercisesRoutes);
router.use('/progress', progressRoutes);
router.use('/practice', practiceRoutes);

export default router;
