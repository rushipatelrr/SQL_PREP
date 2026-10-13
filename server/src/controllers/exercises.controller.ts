import { Request, Response } from 'express';
import { AttemptMode } from '../models/Progress.model';
import { Exercise } from '../models/Exercise.model';
import { Level } from '../models/Level.model';
import { getDatasetPreview } from '../services/sql-sandbox/datasets/registry';
import { NotFoundError, BadRequestError } from '../utils/http-errors';
import {
  getOrCreateProgress,
  getLevelExercisesSorted,
  ensureCourseExerciseAccess,
  ensurePracticeExerciseAccess,
  recordHintUsage,
  revealSolution,
} from '../services/progress.service';
import { submitExercise as submitExerciseService } from '../services/submission.service';

function resolveMode(req: Request): AttemptMode {
  return req.query.mode === 'practice' ? 'practice' : 'course';
}

/**
 * Returns everything the SQL editor page needs — prompt, hint count, a schema preview,
 * and the learner's current attempt count for this exercise — but never the reference
 * `sql`. Hints are revealed one at a time via POST .../hint, and the full solution only
 * via POST .../reveal-solution, both of which carry an XP cost.
 */
export async function getExercise(req: Request, res: Response): Promise<void> {
  const progress = await getOrCreateProgress(req.user!._id.toString());
  const mode = resolveMode(req);
  const { exerciseId } = req.params;

  const exercise = await Exercise.findOne({ exerciseId });
  if (!exercise) throw new NotFoundError(`Exercise "${exerciseId}" does not exist.`);

  if (mode === 'course') {
    ensureCourseExerciseAccess(progress, exercise);
  } else {
    await ensurePracticeExerciseAccess(progress, exercise);
  }

  const level = await Level.findOne({ levelId: exercise.levelId });
  const exercisesInLevel = await getLevelExercisesSorted(exercise.levelId);
  const orderIndex = exercisesInLevel.findIndex((e) => e.exerciseId === exerciseId);

  const attempt =
    progress.activeAttempt && progress.activeAttempt.exerciseId === exerciseId && progress.activeAttempt.mode === mode
      ? progress.activeAttempt
      : { attempts: 0, hintsUsed: 0, solutionRevealed: false };

  const preview = getDatasetPreview(exercise.datasetKey);

  res.json({
    exercise: {
      exerciseId: exercise.exerciseId,
      levelId: exercise.levelId,
      orderIndex,
      totalInLevel: exercisesInLevel.length,
      concept: exercise.concept,
      prompt: exercise.prompt,
      hintsAvailable: exercise.hints.length,
      kind: exercise.kind,
      allowedStatement: exercise.kind === 'mutation' ? exercise.allowedStatement : undefined,
    },
    level: level ? { levelId: level.levelId, title: level.title, concept: level.concept } : null,
    mode,
    attempt: {
      attempts: attempt.attempts,
      hintsUsed: attempt.hintsUsed,
      solutionRevealed: attempt.solutionRevealed,
    },
    schemaSample: {
      table: preview.table,
      columns: preview.columns,
      rows: preview.rows,
      totalRows: preview.totalRows,
    },
  });
}

export async function submitExerciseHandler(req: Request, res: Response): Promise<void> {
  const progress = await getOrCreateProgress(req.user!._id.toString());
  const { sql, mode } = req.body as { sql: string; mode: AttemptMode };
  const result = await submitExerciseService(progress, req.params.exerciseId, sql, mode);
  res.json(result);
}

export async function getHintHandler(req: Request, res: Response): Promise<void> {
  const progress = await getOrCreateProgress(req.user!._id.toString());
  const { mode } = req.body as { mode: AttemptMode };
  const { exerciseId } = req.params;

  const exercise = await Exercise.findOne({ exerciseId });
  if (!exercise) throw new NotFoundError(`Exercise "${exerciseId}" does not exist.`);
  if (mode === 'course') ensureCourseExerciseAccess(progress, exercise);
  else await ensurePracticeExerciseAccess(progress, exercise);

  if (exercise.hints.length === 0) throw new BadRequestError('No hints are available for this exercise.');

  const { hintNumber, hintText } = recordHintUsage(progress, exercise, mode);
  await progress.save();
  res.json({ hintNumber, hintText, hintsAvailable: exercise.hints.length });
}

/** Mirrors the prototype's "Show Solution" button — full reference query, heavier XP cost. */
export async function revealSolutionHandler(req: Request, res: Response): Promise<void> {
  const progress = await getOrCreateProgress(req.user!._id.toString());
  const { mode } = req.body as { mode: AttemptMode };
  const { exerciseId } = req.params;

  const exercise = await Exercise.findOne({ exerciseId }).select('+sql');
  if (!exercise) throw new NotFoundError(`Exercise "${exerciseId}" does not exist.`);
  if (mode === 'course') ensureCourseExerciseAccess(progress, exercise);
  else await ensurePracticeExerciseAccess(progress, exercise);

  revealSolution(progress, exercise, mode);
  await progress.save();
  res.json({ sql: exercise.sql, explanation: exercise.explanation });
}
