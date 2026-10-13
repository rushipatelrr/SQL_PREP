import { parentPort, workerData } from 'worker_threads';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const initSqlJs = require('sql.js');
import { buildCombinedSetupSql } from './datasets/registry';
import { assertSafeQuery, AllowedStatementKind } from './query-guard';

interface WorkerInput {
  datasetKeys: string[];
  maxRows: number;
  /** The statement actually being graded — the learner's or the reference's SQL. */
  primarySql: string;
  /** What kind of statement primarySql must be. Defaults to 'select' (plain read exercises). */
  primaryAllowedStatement?: AllowedStatementKind;
  /**
   * Mutation-kind exercises only: an author-written, trusted SELECT run *after*
   * primarySql has executed, whose result is what actually gets graded. Never guarded —
   * it only ever comes from curriculum.ts, never from a learner.
   */
  verifyQuery?: string;
}

type WorkerOutput =
  | { ok: true; columns: string[]; rows: unknown[][]; truncated: boolean }
  | { ok: false; error: string };

async function main(): Promise<void> {
  const { datasetKeys, maxRows, primarySql, primaryAllowedStatement, verifyQuery } = workerData as WorkerInput;
  let output: WorkerOutput;

  try {
    assertSafeQuery(primarySql, primaryAllowedStatement ?? 'select');

    const SQL = await initSqlJs();
    // A brand-new, in-memory, throwaway database per execution, seeded only with this
    // exercise's dataset(s). It never touches MongoDB, never persists to disk, and
    // disappears the moment this worker exits — so even a DROP TABLE or DELETE here can
    // never affect anything but this one throwaway copy.
    const db = new SQL.Database();
    db.run(buildCombinedSetupSql(datasetKeys));

    const cleanPrimary = primarySql.trim().replace(/;$/, '');

    let result: { columns: string[]; values: unknown[][] }[];
    if (verifyQuery) {
      // Mutation-kind: run the graded statement for its effect, discard any direct
      // result, then grade the *resulting state* via the trusted verify query.
      db.run(cleanPrimary);
      const cleanVerify = verifyQuery.trim().replace(/;$/, '');
      result = db.exec(cleanVerify);
    } else {
      // Query-kind (the original behavior): the primary statement's own result is graded.
      result = db.exec(cleanPrimary);
    }
    db.close();

    if (result.length === 0) {
      output = { ok: true, columns: [], rows: [], truncated: false };
    } else {
      const { columns, values } = result[0];
      const truncated = values.length > maxRows;
      output = { ok: true, columns, rows: values.slice(0, maxRows), truncated };
    }
  } catch (err) {
    output = { ok: false, error: err instanceof Error ? err.message : 'Unknown SQL execution error.' };
  }

  parentPort?.postMessage(output);
}

main();
