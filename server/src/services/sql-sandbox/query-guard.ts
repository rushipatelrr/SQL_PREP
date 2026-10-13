export class SqlGuardError extends Error {}

const MAX_QUERY_LENGTH = 2000;

export type AllowedStatementKind =
  | 'select'
  | 'insert'
  | 'update'
  | 'delete'
  | 'create_table'
  | 'alter_table'
  | 'drop_table'
  | 'create_view'
  | 'create_index';

const STATEMENT_PATTERNS: Record<AllowedStatementKind, RegExp> = {
  select: /^(select|with)\b/i,
  insert: /^insert\b/i,
  update: /^update\b/i,
  delete: /^delete\b/i,
  create_table: /^create\s+table\b/i,
  alter_table: /^alter\s+table\b/i,
  drop_table: /^drop\s+table\b/i,
  create_view: /^create\s+view\b/i,
  create_index: /^(create\s+(unique\s+)?index)\b/i,
};

// This is a teaching sandbox, not a general-purpose SQL engine, and every query runs in
// its own freshly-seeded, throwaway database. What's allowed for a given statement is
// parameterized per exercise (see AllowedStatementKind) so INSERT/UPDATE/DELETE/CREATE/
// ALTER/DROP lessons can permit exactly the one statement type they're teaching — but a
// handful of things have no legitimate place in this single-statement, per-request model
// regardless of the exercise, and stay forbidden unconditionally: attaching another
// database, PRAGMAs, VACUUM/REINDEX, and explicit transaction control.
const ALWAYS_FORBIDDEN =
  /\b(attach|detach|pragma|vacuum|reindex|savepoint|begin|commit|rollback|create\s+trigger|drop\s+trigger)\b/i;

/**
 * Throws SqlGuardError if the query isn't a single statement of the given kind.
 * Does not attempt to fully parse SQL — it's intentionally conservative.
 */
export function assertSafeQuery(sql: string, allowed: AllowedStatementKind = 'select'): void {
  const trimmed = sql.trim();

  if (!trimmed) {
    throw new SqlGuardError('Query is empty.');
  }
  if (trimmed.length > MAX_QUERY_LENGTH) {
    throw new SqlGuardError(`Query is too long (max ${MAX_QUERY_LENGTH} characters).`);
  }

  const withoutTrailingSemicolon = trimmed.endsWith(';') ? trimmed.slice(0, -1) : trimmed;

  if (withoutTrailingSemicolon.includes(';')) {
    throw new SqlGuardError('Only a single statement is allowed — remove the extra semicolon(s).');
  }
  if (ALWAYS_FORBIDDEN.test(withoutTrailingSemicolon)) {
    throw new SqlGuardError('That statement type is not allowed in the learning sandbox.');
  }
  if (!STATEMENT_PATTERNS[allowed].test(withoutTrailingSemicolon)) {
    throw new SqlGuardError(`This exercise expects a single ${allowed.replace(/_/g, ' ').toUpperCase()} statement.`);
  }
}
