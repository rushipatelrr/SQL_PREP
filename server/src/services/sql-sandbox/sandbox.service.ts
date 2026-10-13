import { Worker } from 'worker_threads';
import path from 'path';
import { SqlResult } from './result-matcher';
import { AllowedStatementKind } from './query-guard';

const DEFAULT_TIMEOUT_MS = 3000;
const DEFAULT_MAX_ROWS = 500;

export class SqlSandboxError extends Error {}
export class SqlSandboxTimeoutError extends SqlSandboxError {}

export interface SandboxRunResult extends SqlResult {
  truncated: boolean;
}

export interface SandboxRunOptions {
  /** What kind of statement `primarySql` must be. Defaults to 'select'. */
  primaryAllowedStatement?: AllowedStatementKind;
  /** Mutation-kind exercises only — see sandbox.worker.ts for the grading flow this drives. */
  verifyQuery?: string;
  timeoutMs?: number;
  maxRows?: number;
}

interface WorkerMessage {
  ok: boolean;
  columns?: string[];
  rows?: unknown[][];
  truncated?: boolean;
  error?: string;
}

/**
 * Runs `primarySql` against a fresh, isolated, in-memory sql.js database seeded with the
 * given dataset(s) — completely separate from MongoDB and from every other request.
 * Enforced in two layers: a static keyword/shape guard (query-guard.ts) runs first inside
 * the worker, and a hard wall-clock timeout here terminates the worker outright if a query
 * still manages to run too long (e.g. a pathological CTE).
 *
 * For plain read exercises, `primarySql` is graded directly. For mutation exercises (see
 * `opts.verifyQuery`), `primarySql` is a DML/DDL statement run for its effect, and the
 * *result actually graded* is the trusted `verifyQuery` run afterward against the same
 * mutated database — never the mutation statement's own (usually empty) result.
 *
 * Each call spawns its own worker rather than reusing a pool. That's a deliberate simplicity
 * choice for this course's traffic profile (one query per learner submission, a few seconds
 * apart) — worth revisiting with a worker pool if this needs to scale to heavy concurrent load.
 */
export function runInSandbox(
  primarySql: string,
  datasetKeys: string[],
  opts: SandboxRunOptions = {}
): Promise<SandboxRunResult> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRows = opts.maxRows ?? DEFAULT_MAX_ROWS;

  return new Promise((resolve, reject) => {
    // In dev (ts-node-dev), this file is still a .ts file at runtime, so the worker needs
    // ts-node registered to load sandbox.worker.ts directly. After `npm run build`, both
    // files are plain .js in dist/ and no such flag is needed.
    const isTs = __filename.endsWith('.ts');
    const workerPath = path.join(__dirname, isTs ? 'sandbox.worker.ts' : 'sandbox.worker.js');

    let settled = false;
    const worker = new Worker(workerPath, {
      workerData: {
        primarySql,
        datasetKeys,
        maxRows,
        primaryAllowedStatement: opts.primaryAllowedStatement,
        verifyQuery: opts.verifyQuery,
      },
      execArgv: isTs ? ['-r', 'ts-node/register/transpile-only'] : [],
    });

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      worker.terminate();
      reject(new SqlSandboxTimeoutError('Query took too long to run and was stopped.'));
    }, timeoutMs);

    worker.once('message', (msg: WorkerMessage) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      if (msg.ok) {
        resolve({ columns: msg.columns ?? [], rows: msg.rows ?? [], truncated: msg.truncated ?? false });
      } else {
        reject(new SqlSandboxError(msg.error ?? 'SQL execution failed.'));
      }
    });

    worker.once('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new SqlSandboxError(err.message));
    });

    worker.once('exit', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new SqlSandboxError(`Sandbox worker exited unexpectedly (code ${code}).`));
    });
  });
}
