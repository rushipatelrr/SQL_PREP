import { IProgress, AttemptMode } from '../models/Progress.model';
import { Exercise } from '../models/Exercise.model';
import { NotFoundError, BadRequestError } from '../utils/http-errors';
import { runInSandbox, SandboxRunOptions } from './sql-sandbox/sandbox.service';
import { resultsMatch } from './sql-sandbox/result-matcher';
import {
  ensureCourseExerciseAccess,
  ensurePracticeExerciseAccess,
  recordAttemptExecuted,
  applyCorrectSubmission,
  CourseSubmissionResult,
  PracticeSubmissionResult,
} from './progress.service';

export interface IncorrectSubmissionResult {
  correct: false;
  reason: string;
  resultPreview: { columns: string[]; rows: unknown[][]; truncated: boolean };
}

export type SubmissionResult = IncorrectSubmissionResult | CourseSubmissionResult | PracticeSubmissionResult;

export async function submitExercise(
  progress: IProgress,
  exerciseId: string,
  userSql: string,
  mode: AttemptMode
): Promise<SubmissionResult> {
  if (typeof userSql !== 'string' || !userSql.trim()) {
    throw new BadRequestError('Write a query before running it.');
  }

  // .select('+sql') / .select('+verifyQuery') are required — both are excluded by default
  // so a stray `res.json` elsewhere in the app can never accidentally leak them.
  const exercise = await Exercise.findOne({ exerciseId }).select('+sql +verifyQuery');
  if (!exercise) throw new NotFoundError(`Exercise "${exerciseId}" does not exist.`);

  if (mode === 'course') {
    ensureCourseExerciseAccess(progress, exercise);
  } else {
    await ensurePracticeExerciseAccess(progress, exercise);
  }

  const datasetKeys = [exercise.datasetKey, ...(exercise.extraDatasetKeys ?? [])];

  // Query-kind exercises (the original behavior): the learner's/reference's SQL is a plain
  // SELECT, graded directly. Mutation-kind exercises: it's a single INSERT/UPDATE/DELETE/
  // CREATE/ALTER/DROP statement, graded by its effect on the sandbox — verifyQuery (always
  // author-written, never learner input) runs afterward and *its* result is what's compared.
  const sandboxOpts: SandboxRunOptions =
    exercise.kind === 'mutation'
      ? { primaryAllowedStatement: exercise.allowedStatement, verifyQuery: exercise.verifyQuery }
      : { primaryAllowedStatement: 'select' };

  // Run the learner's statement. An error (syntax error, unknown column, a DROP on a table
  // that doesn't exist, etc.) never counts as an attempt and never touches progress — same
  // as the original client-side behavior.
  const userResult = await runInSandbox(userSql, datasetKeys, sandboxOpts);

  // Attempts only increment once we know the statement at least ran successfully.
  recordAttemptExecuted(progress, exerciseId, mode);

  const expectedResult = await runInSandbox(exercise.sql, datasetKeys, sandboxOpts);
  const verdict = resultsMatch(expectedResult, userResult, exercise.validate);

  if (!verdict.ok) {
    await progress.save();
    return {
      correct: false,
      reason: verdict.reason ?? 'That result is not quite right.',
      resultPreview: userResult,
    };
  }

  return applyCorrectSubmission(progress, exercise, mode);
}
