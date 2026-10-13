import { Request, Response } from 'express';
import { getOrCreateProgress, updateThemePreference } from '../services/progress.service';

export async function getMyProgress(req: Request, res: Response): Promise<void> {
  const progress = await getOrCreateProgress(req.user!._id.toString());

  res.json({
    currentLevelId: progress.currentLevelId,
    currentExerciseId: progress.currentExerciseId,
    courseStage: progress.courseStage,
    courseTopicIndex: progress.courseTopicIndex,
    completedExercises: progress.completedExercises,
    completedLevels: progress.completedLevels,
    xp: progress.xp,
    streak: progress.streak,
    achievements: progress.achievements,
    allLevelsCompleted: progress.allLevelsCompleted,
    practiceSession: progress.practiceSession,
    themePreference: progress.themePreference ?? null,
    // Deliberately omit activeAttempt: attempt/hint counters are the server's private
    // anti-cheat bookkeeping, not something the client needs to render anything.
  });
}

export async function updateTheme(req: Request, res: Response): Promise<void> {
  const progress = await getOrCreateProgress(req.user!._id.toString());
  const { theme } = req.body as { theme: 'dark' | 'light' };
  await updateThemePreference(progress, theme);
  res.json({ themePreference: theme });
}
