/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
/**
 * Runs every exercise's reference SQL against its dataset and reports failures. For
 * mutation-kind exercises, mirrors the real grading flow: run the reference statement,
 * then run verifyQuery against the resulting state. Uses Node's built-in `node:sqlite`
 * (Node 22.5+) rather than `sql.js`, purely so this script has zero dependency on
 * `npm install` having been run yet. Node's bundled SQLite version can differ slightly from
 * the one `sql.js` ships, so a clean run here is strong evidence the query is valid SQL and
 * matches the intended dataset — not an absolute guarantee against every dialect quirk.
 * Re-run this any time curriculum.ts changes: `npx tsx scripts/verify-curriculum.ts`.
 */
import { CURRICULUM } from '../src/data/curriculum';
import { buildCombinedSetupSql } from '../src/services/sql-sandbox/datasets/registry';

async function main(): Promise<void> {
  let DatabaseSync: any;
  try {
    // @ts-ignore
    ({ DatabaseSync } = await import('node:sqlite'));
  } catch {
    console.error('node:sqlite is unavailable on this Node version (needs 22.5+). Skipping.');
    process.exit(0);
  }

  const setupCache = new Map<string, string>();
  function setupFor(datasetKeys: string[]): string {
    const cacheKey = datasetKeys.join('+');
    let sql = setupCache.get(cacheKey);
    if (!sql) {
      sql = buildCombinedSetupSql(datasetKeys);
      setupCache.set(cacheKey, sql);
    }
    return sql;
  }

  let total = 0;
  let failed = 0;

  for (const level of CURRICULUM) {
    for (let i = 0; i < level.exercises.length; i++) {
      const ex = level.exercises[i];
      const exerciseId = `${level.levelId}-ex-${i + 1}`;
      const datasetKeys = [ex.datasetKey, ...(ex.extraDatasetKeys ?? [])];
      const isMutation = ex.kind === 'mutation';
      total++;
      try {
        const db = new DatabaseSync(':memory:');
        db.exec(setupFor(datasetKeys));

        let rows: unknown[];
        if (isMutation) {
          if (!ex.verifyQuery) throw new Error('mutation-kind exercise is missing verifyQuery');
          db.exec(ex.sql.trim().replace(/;$/, ''));
          rows = db.prepare(ex.verifyQuery.trim().replace(/;$/, '')).all();
        } else {
          rows = db.prepare(ex.sql.trim().replace(/;$/, '')).all();
        }

        const cols = rows.length > 0 ? Object.keys(rows[0] as object) : [];
        const tag = isMutation ? `${datasetKeys.join('+')}, mutation:${ex.allowedStatement}` : datasetKeys.join('+');
        console.log(`OK   ${exerciseId} (${tag}) — ${rows.length} row(s), columns: [${cols.join(', ')}]`);
        if (rows.length === 0 && !isMutation) {
          console.log(`     ⚠️  zero rows — double check this is intentional for "${ex.concept}"`);
        }
        db.close();
      } catch (err) {
        failed++;
        console.log(`FAIL ${exerciseId} (${datasetKeys.join('+')}) — ${ex.concept}`);
        console.log(`     ${err instanceof Error ? err.message : err}`);
        console.log(`     sql: ${ex.sql}`);
        if (ex.verifyQuery) console.log(`     verifyQuery: ${ex.verifyQuery}`);
      }
    }
  }

  console.log(`\n${total - failed}/${total} exercise reference queries ran successfully.`);
  if (failed > 0) process.exit(1);
}

main();
