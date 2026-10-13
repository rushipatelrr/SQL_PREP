import { connectTestDB, disconnectTestDB, clearTestDB } from './testDb';
import { Level } from '../src/models/Level.model';
import { Exercise } from '../src/models/Exercise.model';
import { Progress } from '../src/models/Progress.model';
import { User } from '../src/models/User.model';
import {
  computeLevelState,
  listLevelsForUser,
  applyCorrectSubmission,
  startPracticeSession,
} from '../src/services/progress.service';

async function seedTwoLevelCurriculum() {
  await Level.create([
    { levelId: 'level-1', order: 0, title: 'Level One', concept: 'SELECT', topics: [] },
    { levelId: 'level-2', order: 1, title: 'Level Two', concept: 'WHERE', topics: [] },
  ]);
  await Exercise.create([
    { exerciseId: 'level-1-ex-1', levelId: 'level-1', orderIndex: 0, concept: 'a', prompt: 'p', sql: 'SELECT 1;', validate: { order: false, exactColumns: false }, hints: ['h1', 'h2'], explanation: 'e' },
    { exerciseId: 'level-1-ex-2', levelId: 'level-1', orderIndex: 1, concept: 'b', prompt: 'p', sql: 'SELECT 1;', validate: { order: false, exactColumns: false }, hints: [], explanation: 'e' },
    { exerciseId: 'level-2-ex-1', levelId: 'level-2', orderIndex: 0, concept: 'c', prompt: 'p', sql: 'SELECT 1;', validate: { order: false, exactColumns: false }, hints: [], explanation: 'e' },
  ]);
}

async function makeUserAndProgress(email: string) {
  const user = await User.create({ googleId: `g-${email}`, email, name: email });
  const progress = await Progress.create({
    userId: user._id,
    currentLevelId: 'level-1',
    currentExerciseId: 'level-1-ex-1',
    courseStage: 'theory',
    courseTopicIndex: 0,
  });
  return { user, progress };
}

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

describe('computeLevelState', () => {
  it('marks levels completed, current, or locked relative to progress', async () => {
    await seedTwoLevelCurriculum();
    const { progress } = await makeUserAndProgress('a@example.com');
    const levels = await Level.find().sort('order');

    expect(computeLevelState(levels[0], progress)).toBe('current');
    expect(computeLevelState(levels[1], progress)).toBe('locked');
  });

  it('reflects completed levels via listLevelsForUser', async () => {
    await seedTwoLevelCurriculum();
    const { progress } = await makeUserAndProgress('b@example.com');
    progress.completedLevels = ['level-1'];
    progress.currentLevelId = 'level-2';
    await progress.save();

    const summaries = await listLevelsForUser(progress);
    expect(summaries.find((l) => l.levelId === 'level-1')?.state).toBe('completed');
    expect(summaries.find((l) => l.levelId === 'level-2')?.state).toBe('current');
  });
});

describe('applyCorrectSubmission — course mode', () => {
  it('advances to the next exercise in the same level without completing it', async () => {
    await seedTwoLevelCurriculum();
    const { progress } = await makeUserAndProgress('c@example.com');
    const ex1 = await Exercise.findOne({ exerciseId: 'level-1-ex-1' }).select('+sql');

    const result = await applyCorrectSubmission(progress, ex1!, 'course');

    expect(result.correct).toBe(true);
    if (result.mode !== 'course') throw new Error('expected course result');
    expect(result.levelCompleted).toBe(false);
    expect(result.nextExerciseId).toBe('level-1-ex-2');
    expect(result.xpAwarded).toBe(100); // first attempt, no hints
    expect(progress.completedExercises).toContain('level-1-ex-1');
    expect(progress.completedLevels).not.toContain('level-1');
  });

  it('completes the level and unlocks the next one on the last exercise', async () => {
    await seedTwoLevelCurriculum();
    const { progress } = await makeUserAndProgress('d@example.com');
    progress.currentExerciseId = 'level-1-ex-2';
    await progress.save();
    const ex2 = await Exercise.findOne({ exerciseId: 'level-1-ex-2' }).select('+sql');

    const result = await applyCorrectSubmission(progress, ex2!, 'course');

    if (result.mode !== 'course') throw new Error('expected course result');
    expect(result.levelCompleted).toBe(true);
    expect(result.nextLevelId).toBe('level-2');
    expect(progress.completedLevels).toContain('level-1');
    expect(progress.currentLevelId).toBe('level-2');
    expect(progress.currentExerciseId).toBe('level-2-ex-1');
    expect(progress.courseStage).toBe('theory');
  });

  it('never awards first-completion XP twice for the same exercise', async () => {
    await seedTwoLevelCurriculum();
    const { progress } = await makeUserAndProgress('e@example.com');
    const ex1 = await Exercise.findOne({ exerciseId: 'level-1-ex-1' }).select('+sql');

    await applyCorrectSubmission(progress, ex1!, 'course');
    const xpAfterFirst = progress.xp;

    // Re-run the same (already completed) exercise in course mode — shouldn't happen via
    // the real access checks, but the service itself must still be safe if it ever did.
    const again = await applyCorrectSubmission(progress, ex1!, 'course');
    if (again.mode !== 'course') throw new Error('expected course result');
    expect(again.xpAwarded).toBe(0);
    expect(progress.xp).toBe(xpAfterFirst);
  });
});

describe('Practice Again', () => {
  it('never awards XP and never touches historical completion, even after finishing the level again', async () => {
    await seedTwoLevelCurriculum();
    const { progress } = await makeUserAndProgress('f@example.com');
    progress.completedLevels = ['level-1'];
    progress.xp = 250;
    progress.currentLevelId = 'level-2';
    progress.currentExerciseId = 'level-2-ex-1';
    await progress.save();

    await startPracticeSession(progress, 'level-1');
    expect(progress.practiceSession?.levelId).toBe('level-1');
    expect(progress.practiceSession?.exerciseIndex).toBe(0);

    const ex1 = await Exercise.findOne({ exerciseId: 'level-1-ex-1' }).select('+sql');
    const r1 = await applyCorrectSubmission(progress, ex1!, 'practice');
    if (r1.mode !== 'practice') throw new Error('expected practice result');
    expect(r1.practiceComplete).toBe(false);
    expect(progress.xp).toBe(250); // unchanged

    const ex2 = await Exercise.findOne({ exerciseId: 'level-1-ex-2' }).select('+sql');
    const r2 = await applyCorrectSubmission(progress, ex2!, 'practice');
    if (r2.mode !== 'practice') throw new Error('expected practice result');
    expect(r2.practiceComplete).toBe(true);

    // Historical record is exactly as it was before Practice Again started.
    expect(progress.xp).toBe(250);
    expect(progress.completedLevels).toEqual(['level-1']);
    expect(progress.currentLevelId).toBe('level-2');
    expect(progress.currentExerciseId).toBe('level-2-ex-1');
    expect(progress.practiceSession).toBeNull();
  });

  it('refuses to start a practice session for a level that is not yet completed', async () => {
    await seedTwoLevelCurriculum();
    const { progress } = await makeUserAndProgress('g@example.com');
    await expect(startPracticeSession(progress, 'level-2')).rejects.toThrow();
  });
});

describe('user isolation', () => {
  it('keeps two users progress completely separate', async () => {
    await seedTwoLevelCurriculum();
    const { progress: progressA } = await makeUserAndProgress('h@example.com');
    const { progress: progressB } = await makeUserAndProgress('i@example.com');

    const ex1 = await Exercise.findOne({ exerciseId: 'level-1-ex-1' }).select('+sql');
    await applyCorrectSubmission(progressA, ex1!, 'course');

    const reloadedB = await Progress.findById(progressB._id);
    expect(reloadedB!.xp).toBe(0);
    expect(reloadedB!.completedExercises).toEqual([]);
  });
});
