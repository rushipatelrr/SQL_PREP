/* eslint-disable no-console */
import { connectDB, disconnectDB } from '../src/config/db';
import { Level } from '../src/models/Level.model';
import { Exercise } from '../src/models/Exercise.model';
import { CURRICULUM } from '../src/data/curriculum';

async function seed(): Promise<void> {
  await connectDB();
  console.log('[seed] connected to MongoDB');

  let levelCount = 0;
  let exerciseCount = 0;

  for (const level of CURRICULUM) {
    await Level.findOneAndUpdate(
      { levelId: level.levelId },
      {
        levelId: level.levelId,
        order: level.order,
        title: level.title,
        concept: level.concept,
        topics: level.topics.map((t, i) => ({ ...t, order: i })),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    levelCount++;

    for (let i = 0; i < level.exercises.length; i++) {
      const ex = level.exercises[i];
      const exerciseId = `${level.levelId}-ex-${i + 1}`;
      await Exercise.findOneAndUpdate(
        { exerciseId },
        {
          exerciseId,
          levelId: level.levelId,
          orderIndex: i,
          concept: ex.concept,
          datasetKey: ex.datasetKey,
          extraDatasetKeys: ex.extraDatasetKeys ?? [],
          prompt: ex.prompt,
          kind: ex.kind ?? 'query',
          allowedStatement: ex.allowedStatement,
          verifyQuery: ex.verifyQuery,
          sql: ex.sql,
          validate: ex.validate,
          hints: ex.hints,
          explanation: ex.explanation,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      exerciseCount++;
    }
  }

  console.log(`[seed] upserted ${levelCount} level(s) and ${exerciseCount} exercise(s).`);
  await disconnectDB();
  console.log('[seed] done.');
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
