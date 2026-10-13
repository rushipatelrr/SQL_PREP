import express, { Express, Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { connectTestDB, disconnectTestDB, clearTestDB } from './testDb';
import { Level } from '../src/models/Level.model';
import { Exercise } from '../src/models/Exercise.model';
import { User, IUser } from '../src/models/User.model';
import { Progress } from '../src/models/Progress.model';
import apiRoutes from '../src/routes';
import { notFoundHandler, errorHandler } from '../src/middleware/error.middleware';

/**
 * Builds a minimal app around the real route/controller/service stack, faking
 * authentication instead of running a live Google OAuth handshake (which needs real
 * network access and real credentials — exercise that path manually per the README).
 * `requireAuth` only cares about req.isAuthenticated()/req.user, so this is a faithful
 * stand-in for "Passport has already verified this session."
 */
function buildAppAs(user: IUser | null): Express {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (user) {
      req.user = user;
      // Passport types isAuthenticated() as a type predicate; a plain boolean-returning
      // stand-in needs a cast to satisfy that signature in this test-only shim.
      (req as unknown as { isAuthenticated: () => boolean }).isAuthenticated = () => true;
    } else {
      (req as unknown as { isAuthenticated: () => boolean }).isAuthenticated = () => false;
    }
    next();
  });
  app.use('/api', apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

async function seedCurriculum() {
  await Level.create([{ levelId: 'level-1', order: 0, title: 'Level One', concept: 'SELECT', topics: [] }]);
  await Exercise.create([
    {
      exerciseId: 'level-1-ex-1',
      levelId: 'level-1',
      orderIndex: 0,
      concept: 'SELECT *',
      prompt: 'Select everything.',
      sql: 'SELECT * FROM students;',
      validate: { order: false, exactColumns: true },
      hints: ['Use *'],
      explanation: 'e',
    },
    {
      exerciseId: 'level-1-ex-2',
      levelId: 'level-1',
      orderIndex: 1,
      concept: 'WHERE',
      prompt: 'Filter it.',
      sql: 'SELECT * FROM students WHERE age > 25;',
      validate: { order: false, exactColumns: false },
      hints: [],
      explanation: 'e',
    },
    {
      exerciseId: 'level-1-ex-3',
      levelId: 'level-1',
      orderIndex: 2,
      concept: 'INSERT',
      datasetKey: 'employees',
      kind: 'mutation',
      allowedStatement: 'insert',
      prompt: "Insert a new employee named 'Test Person'.",
      sql: "INSERT INTO employees (id, full_name, department, salary, manager_id, hire_date, bonus, department_id) VALUES (99, 'Test Person', 'Engineering', 100000, 2, '2024-01-01', NULL, 2);",
      verifyQuery: "SELECT full_name, department, salary FROM employees WHERE full_name = 'Test Person';",
      validate: { order: false, exactColumns: true },
      hints: [],
      explanation: 'e',
    },
  ]);
}

async function makeUser(email: string): Promise<IUser> {
  const user = await User.create({ googleId: `g-${email}`, email, name: email });
  await Progress.create({
    userId: user._id,
    currentLevelId: 'level-1',
    currentExerciseId: 'level-1-ex-1',
    courseStage: 'practice',
    courseTopicIndex: 0,
  });
  return user;
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

describe('authentication is required', () => {
  it('rejects GET /api/progress/me with no session', async () => {
    const app = buildAppAs(null);
    const res = await request(app).get('/api/progress/me');
    expect(res.status).toBe(401);
  });

  it('rejects submitting an exercise with no session', async () => {
    await seedCurriculum();
    const app = buildAppAs(null);
    const res = await request(app)
      .post('/api/exercises/level-1-ex-1/submit')
      .send({ sql: 'SELECT * FROM students;', mode: 'course' });
    expect(res.status).toBe(401);
  });
});

describe('the critical learning flow', () => {
  it('runs a correct query, persists completion, and moves to the next exercise', async () => {
    await seedCurriculum();
    const user = await makeUser('flow@example.com');
    const app = buildAppAs(user);

    const submitRes = await request(app)
      .post('/api/exercises/level-1-ex-1/submit')
      .send({ sql: 'SELECT * FROM students;', mode: 'course' });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.correct).toBe(true);
    expect(submitRes.body.nextExerciseId).toBe('level-1-ex-2');
    expect(submitRes.body.xpAwarded).toBe(100);

    // Simulate "refresh the browser" — a brand new request must see the same, persisted state.
    const progressRes = await request(app).get('/api/progress/me');
    expect(progressRes.body.completedExercises).toContain('level-1-ex-1');
    expect(progressRes.body.currentExerciseId).toBe('level-1-ex-2');
    expect(progressRes.body.xp).toBe(100);
  }, 15000);

  it('keeps the learner on the same exercise after an incorrect answer', async () => {
    await seedCurriculum();
    const user = await makeUser('wrong@example.com');
    const app = buildAppAs(user);

    const res = await request(app)
      .post('/api/exercises/level-1-ex-1/submit')
      .send({ sql: 'SELECT name FROM students;', mode: 'course' }); // wrong: exactColumns expects *

    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(false);

    const progressRes = await request(app).get('/api/progress/me');
    expect(progressRes.body.currentExerciseId).toBe('level-1-ex-1');
    expect(progressRes.body.completedExercises).not.toContain('level-1-ex-1');
  }, 15000);

  it("rejects a submission for an exercise that is not the caller's current one", async () => {
    await seedCurriculum();
    const user = await makeUser('outoforder@example.com');
    const app = buildAppAs(user);

    const res = await request(app)
      .post('/api/exercises/level-1-ex-2/submit') // still on ex-1
      .send({ sql: 'SELECT 1;', mode: 'course' });

    expect(res.status).toBe(403);
  });
});

describe('mutation-kind exercises (INSERT/UPDATE/DELETE/DDL)', () => {
  it('grades an INSERT exercise by its effect, via the real sandbox', async () => {
    await seedCurriculum();
    const user = await User.create({ googleId: 'g-mutation@example.com', email: 'mutation@example.com', name: 'Mutation Tester' });
    await Progress.create({
      userId: user._id,
      currentLevelId: 'level-1',
      currentExerciseId: 'level-1-ex-3', // skip straight to the mutation exercise for this test
      courseStage: 'practice',
      courseTopicIndex: 0,
    });
    const app = buildAppAs(user);

    const correct = await request(app)
      .post('/api/exercises/level-1-ex-3/submit')
      .send({
        sql: "INSERT INTO employees (id, full_name, department, salary, manager_id, hire_date, bonus, department_id) VALUES (100, 'Test Person', 'Engineering', 100000, 2, '2024-01-01', NULL, 2);",
        mode: 'course',
      });
    expect(correct.status).toBe(200);
    expect(correct.body.correct).toBe(true);

    // A different id is fine — the verify query only checks name/department/salary — but
    // getting the department wrong must still fail.
    const userB = await User.create({ googleId: 'g-mutation2@example.com', email: 'mutation2@example.com', name: 'Mutation Tester 2' });
    await Progress.create({
      userId: userB._id,
      currentLevelId: 'level-1',
      currentExerciseId: 'level-1-ex-3',
      courseStage: 'practice',
      courseTopicIndex: 0,
    });
    const wrong = await request(buildAppAs(userB))
      .post('/api/exercises/level-1-ex-3/submit')
      .send({
        sql: "INSERT INTO employees (id, full_name, department, salary, manager_id, hire_date, bonus, department_id) VALUES (101, 'Test Person', 'Sales', 100000, 3, '2024-01-01', NULL, 3);",
        mode: 'course',
      });
    expect(wrong.status).toBe(200);
    expect(wrong.body.correct).toBe(false);
  }, 15000);

  it('rejects a statement type that does not match the exercise (guard enforced end-to-end)', async () => {
    await seedCurriculum();
    const user = await User.create({ googleId: 'g-mutation3@example.com', email: 'mutation3@example.com', name: 'Mutation Tester 3' });
    await Progress.create({
      userId: user._id,
      currentLevelId: 'level-1',
      currentExerciseId: 'level-1-ex-3',
      courseStage: 'practice',
      courseTopicIndex: 0,
    });

    const res = await request(buildAppAs(user))
      .post('/api/exercises/level-1-ex-3/submit')
      .send({ sql: 'SELECT * FROM employees;', mode: 'course' }); // a SELECT where INSERT is required

    // The guard throws inside the sandbox worker, which submission.service surfaces as a
    // 400 via SqlSandboxError — not a 200 with correct:false.
    expect(res.status).toBe(400);
  }, 15000);
});

describe('progress isolation between users', () => {
  it("never returns one user's progress for another user's session", async () => {
    await seedCurriculum();
    const userA = await makeUser('userA@example.com');
    await makeUser('userB@example.com');

    const appA = buildAppAs(userA);
    await request(appA)
      .post('/api/exercises/level-1-ex-1/submit')
      .send({ sql: 'SELECT * FROM students;', mode: 'course' });

    const freshUserB = await User.findOne({ email: 'userB@example.com' });
    const appB = buildAppAs(freshUserB!);
    const progressRes = await request(appB).get('/api/progress/me');

    expect(progressRes.body.xp).toBe(0);
    expect(progressRes.body.completedExercises).toEqual([]);
  }, 15000);
});
