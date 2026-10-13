import { Request, Response } from 'express';
import { getOrCreateProgress, startPracticeSession } from '../services/progress.service';

export async function startPractice(req: Request, res: Response): Promise<void> {
  const progress = await getOrCreateProgress(req.user!._id.toString());
  const firstExercise = await startPracticeSession(progress, req.params.levelId);
  res.json({
    levelId: req.params.levelId,
    firstExerciseId: firstExercise.exerciseId,
  });
}
