import { Progress, IProgress, AttemptMode } from '../models/Progress.model';
import { Level, ILevel } from '../models/Level.model';
import { Exercise, IExercise } from '../models/Exercise.model';
import { ForbiddenError, NotFoundError } from '../utils/http-errors';
import { computeAward } from './scoring';

export type LevelState = 'completed' | 'current' | 'available' | 'locked';

/**
 * Loads (or, as a defensive fallback, creates) the Progress document for a user. Under
 * normal operation this is always created at sign-up in user.service.ts — this fallback
 * only matters if that step ever failed partway.
 */
export async function getOrCreateProgress(userId: string): Promise<IProgress> {
  let progress = await Progress.findOne({ userId });
  if (progress) return progress;

  const levels = await Level.find().sort('order');
  const firstLevel = levels[0];
  if (!firstLevel) throw new Error('No levels exist — run the seed script first.');
  const firstExercise = await Exercise.findOne({ levelId: firstLevel.levelId }).sort('orderIndex');
  if (!firstExercise) throw new Error(`Level "${firstLevel.levelId}" has no exercises.`);

  progress = await Progress.create({
    userId,
    currentLevelId: firstLevel.levelId,
    currentExerciseId: firstExercise.exerciseId,
    courseStage: 'theory',
    courseTopicIndex: 0,
  });
  return progress;
}

/**
 * The server — not the client — decides whether a level is completed, the one the learner
 * is currently on, or still locked. With today's strictly linear curriculum this collapses
 * to completed/current/locked; `available` exists so a future non-linear curriculum (e.g.
 * optional side levels) has somewhere to go without a schema change.
 */
export function computeLevelState(level: ILevel, progress: IProgress): LevelState {
  if (progress.completedLevels.includes(level.levelId)) return 'completed';
  if (level.levelId === progress.currentLevelId) return 'current';
  return 'locked';
}

export interface LevelSummary {
  levelId: string;
  order: number;
  title: string;
  concept: string;
  state: LevelState;
  topicCount: number;
  exerciseCount: number;
}

export async function listLevelsForUser(progress: IProgress): Promise<LevelSummary[]> {
  const levels = await Level.find().sort('order');
  const exerciseCounts = await Exercise.aggregate<{ _id: string; count: number }>([
    { $group: { _id: '$levelId', count: { $sum: 1 } } },
  ]);
  const countByLevel = new Map(exerciseCounts.map((e) => [e._id, e.count]));

  return levels.map((level) => ({
    levelId: level.levelId,
    order: level.order,
    title: level.title,
    concept: level.concept,
    state: computeLevelState(level, progress),
    topicCount: level.topics.length,
    exerciseCount: countByLevel.get(level.levelId) ?? 0,
  }));
}

export interface LevelDetail extends LevelSummary {
  topics: ILevel['topics'];
  exercises: Array<{ exerciseId: string; orderIndex: number; concept: string; prompt: string }> | null;
}

export async function getLevelDetailForUser(levelId: string, progress: IProgress): Promise<LevelDetail> {
  const level = await Level.findOne({ levelId });
  if (!level) throw new NotFoundError(`Level "${levelId}" does not exist.`);

  const state = computeLevelState(level, progress);
  if (state === 'locked') {
    throw new ForbiddenError('This level is locked — complete the earlier levels first.');
  }

  const exerciseCount = await Exercise.countDocuments({ levelId });

  // Full exercise list (concept + prompt, never the answer) is only exposed for completed
  // levels, matching the original "Review exercises / see completed exercises" behavior.
  // The current level's exercises are revealed one at a time via GET /api/exercises/:id,
  // preserving the original's sequential-discovery UX.
  let exercises: LevelDetail['exercises'] = null;
  if (state === 'completed') {
    const docs = await Exercise.find({ levelId }).sort('orderIndex');
    exercises = docs.map((e) => ({
      exerciseId: e.exerciseId,
      orderIndex: e.orderIndex,
      concept: e.concept,
      prompt: e.prompt,
    }));
  }

  return {
    levelId: level.levelId,
    order: level.order,
    title: level.title,
    concept: level.concept,
    state,
    topicCount: level.topics.length,
    exerciseCount,
    topics: level.topics,
    exercises,
  };
}

/** Every exercise in a level, sorted, with the reference SQL excluded (default schema behavior). */
export async function getLevelExercisesSorted(levelId: string): Promise<IExercise[]> {
  return Exercise.find({ levelId }).sort('orderIndex');
}

export function ensureCourseExerciseAccess(progress: IProgress, exercise: IExercise): void {
  if (progress.currentExerciseId !== exercise.exerciseId) {
    throw new ForbiddenError('That is not your current exercise.');
  }
}

export async function ensurePracticeExerciseAccess(progress: IProgress, exercise: IExercise): Promise<void> {
  if (!progress.completedLevels.includes(exercise.levelId)) {
    throw new ForbiddenError('You can only practice a level you have already completed.');
  }
  if (!progress.practiceSession || progress.practiceSession.levelId !== exercise.levelId) {
    throw new ForbiddenError('Start a practice session for this level first.');
  }
  const exercises = await getLevelExercisesSorted(exercise.levelId);
  const expected = exercises[progress.practiceSession.exerciseIndex];
  if (!expected || expected.exerciseId !== exercise.exerciseId) {
    throw new ForbiddenError('That is not your current practice exercise.');
  }
}

/**
 * Returns the in-progress attempt counter for this exercise+mode, starting a fresh one
 * (attempts/hints at zero) whenever the learner moves to a different exercise or mode.
 * Refreshing the page while still on the *same* exercise does NOT reset it — attempts and
 * hints are tracked here, server-side, specifically so the client can never wipe them by
 * reloading and re-submitting to farm full first-try XP.
 */
export function getOrResetActiveAttempt(progress: IProgress, exerciseId: string, mode: AttemptMode) {
  const current = progress.activeAttempt;
  if (current && current.exerciseId === exerciseId && current.mode === mode) {
    return current;
  }
  const fresh = { exerciseId, mode, attempts: 0, hintsUsed: 0, solutionRevealed: false };
  progress.activeAttempt = fresh;
  return fresh;
}

export function recordAttemptExecuted(progress: IProgress, exerciseId: string, mode: AttemptMode) {
  const attempt = getOrResetActiveAttempt(progress, exerciseId, mode);
  attempt.attempts += 1;
  progress.activeAttempt = attempt;
  return attempt;
}

export function recordHintUsage(progress: IProgress, exercise: IExercise, mode: AttemptMode): { hintNumber: number; hintText: string } {
  const attempt = getOrResetActiveAttempt(progress, exercise.exerciseId, mode);
  attempt.hintsUsed = Math.min(attempt.hintsUsed + 1, exercise.hints.length);
  progress.activeAttempt = attempt;
  return { hintNumber: attempt.hintsUsed, hintText: exercise.hints[attempt.hintsUsed - 1] };
}

export function revealSolution(progress: IProgress, exercise: IExercise, mode: AttemptMode): void {
  const attempt = getOrResetActiveAttempt(progress, exercise.exerciseId, mode);
  attempt.solutionRevealed = true;
  progress.activeAttempt = attempt;
}

/**
 * Theme is a per-browser UI preference by default (client-side storage); this just lets an
 * authenticated user optionally carry it across devices, per spec section 20. It never
 * touches XP, completion, or any other part of the historical record.
 */
export async function updateThemePreference(progress: IProgress, theme: 'dark' | 'light'): Promise<void> {
  progress.themePreference = theme;
  await progress.save();
}

export async function startPracticeSession(progress: IProgress, levelId: string): Promise<IExercise> {
  if (!progress.completedLevels.includes(levelId)) {
    throw new ForbiddenError('You can only practice a level you have already completed.');
  }
  const exercises = await getLevelExercisesSorted(levelId);
  const first = exercises[0];
  if (!first) throw new NotFoundError(`Level "${levelId}" has no exercises.`);

  progress.practiceSession = { levelId, exerciseIndex: 0 };
  progress.activeAttempt = null;
  await progress.save();
  return first;
}

export interface CourseSubmissionResult {
  correct: true;
  mode: 'course';
  xpAwarded: number;
  totalXp: number;
  levelCompleted: boolean;
  allLevelsCompleted: boolean;
  nextExerciseId: string | null;
  nextLevelId: string | null;
}

export interface PracticeSubmissionResult {
  correct: true;
  mode: 'practice';
  practiceComplete: boolean;
  nextExerciseId: string | null;
}

/**
 * Mutates and persists progress after a *correct* submission has already been verified by
 * the sandbox. This is the only place completedExercises/completedLevels/xp ever change,
 * and it is never reachable without passing ensureCourseExerciseAccess /
 * ensurePracticeExerciseAccess first.
 */
export async function applyCorrectSubmission(
  progress: IProgress,
  exercise: IExercise,
  mode: AttemptMode
): Promise<CourseSubmissionResult | PracticeSubmissionResult> {
  const levelExercises = await getLevelExercisesSorted(exercise.levelId);
  const indexInLevel = levelExercises.findIndex((e) => e.exerciseId === exercise.exerciseId);
  const isLastInLevel = indexInLevel === levelExercises.length - 1;

  if (mode === 'practice') {
    // Practice Again: reinforcement only. No XP, no completion side effects of any kind —
    // completedExercises/completedLevels/xp/achievements/mastery are untouched.
    if (!isLastInLevel) {
      progress.practiceSession = { levelId: exercise.levelId, exerciseIndex: indexInLevel + 1 };
      progress.activeAttempt = null;
      await progress.save();
      return { correct: true, mode: 'practice', practiceComplete: false, nextExerciseId: levelExercises[indexInLevel + 1].exerciseId };
    }
    progress.practiceSession = null;
    progress.activeAttempt = null;
    await progress.save();
    return { correct: true, mode: 'practice', practiceComplete: true, nextExerciseId: null };
  }

  // --- course mode ---
  const attempt = getOrResetActiveAttempt(progress, exercise.exerciseId, 'course');
  const alreadyCompleted = progress.completedExercises.includes(exercise.exerciseId);
  const award = alreadyCompleted ? 0 : computeAward(attempt.attempts, attempt.hintsUsed, attempt.solutionRevealed);

  progress.xp += award;
  progress.streak += 1;
  if (!alreadyCompleted) progress.completedExercises.push(exercise.exerciseId);
  progress.activeAttempt = null;

  if (!isLastInLevel) {
    const next = levelExercises[indexInLevel + 1];
    progress.currentExerciseId = next.exerciseId;
    progress.courseStage = 'practice';
    await progress.save();
    return {
      correct: true,
      mode: 'course',
      xpAwarded: award,
      totalXp: progress.xp,
      levelCompleted: false,
      allLevelsCompleted: false,
      nextExerciseId: next.exerciseId,
      nextLevelId: null,
    };
  }

  // Last exercise in the level — complete it (idempotent) and figure out what's next.
  if (!progress.completedLevels.includes(exercise.levelId)) {
    progress.completedLevels.push(exercise.levelId);
  }

  const allLevels = await Level.find().sort('order');
  const levelPos = allLevels.findIndex((l) => l.levelId === exercise.levelId);
  const isLastLevel = levelPos === allLevels.length - 1;

  if (isLastLevel) {
    progress.allLevelsCompleted = true;
    await progress.save();
    return {
      correct: true,
      mode: 'course',
      xpAwarded: award,
      totalXp: progress.xp,
      levelCompleted: true,
      allLevelsCompleted: true,
      nextExerciseId: null,
      nextLevelId: null,
    };
  }

  const nextLevel = allLevels[levelPos + 1];
  const nextLevelExercises = await getLevelExercisesSorted(nextLevel.levelId);
  const nextFirstExercise = nextLevelExercises[0];
  if (!nextFirstExercise) throw new Error(`Level "${nextLevel.levelId}" has no exercises.`);

  progress.currentLevelId = nextLevel.levelId;
  progress.currentExerciseId = nextFirstExercise.exerciseId;
  progress.courseStage = 'theory';
  progress.courseTopicIndex = 0;
  await progress.save();

  return {
    correct: true,
    mode: 'course',
    xpAwarded: award,
    totalXp: progress.xp,
    levelCompleted: true,
    allLevelsCompleted: false,
    nextExerciseId: nextFirstExercise.exerciseId,
    nextLevelId: nextLevel.levelId,
  };
}
